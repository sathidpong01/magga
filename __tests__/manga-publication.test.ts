import { afterAll, beforeAll, beforeEach, expect, it } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { publishScheduledManga } from "@/lib/manga-publication";

const pg = new PGlite();
const database = drizzle(pg);
const id = "10000000-0000-4000-8000-000000000001";
beforeAll(async () => {
  await pg.exec(`CREATE TABLE manga(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text, is_hidden boolean NOT NULL DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());`);
  await pg.exec(await Bun.file(new URL("../db/migrations/0016_scheduled_manga_publication.sql", import.meta.url)).text());
}, 30000);
beforeEach(async () => {
  await pg.exec(`TRUNCATE manga; INSERT INTO manga(id,slug,is_hidden,scheduled_publish_at,publication_time_zone,created_at) VALUES
    ('${id}','due',true,now()-interval '1 minute','Asia/Bangkok','2020-01-01'),
    (gen_random_uuid(),'future',true,now()+interval '1 day','Asia/Bangkok','2020-01-01'),
    (gen_random_uuid(),'draft',true,null,null,'2020-01-01'),
    (gen_random_uuid(),'published',false,null,null,'2020-01-01');`);
});
afterAll(() => pg.close());
it("publishes only due work, refreshes its slug, and makes retries harmless", async () => {
  const slugs: string[][] = [];
  expect(await publishScheduledManga(database, value => { slugs.push(value); return true; })).toEqual({ published: 1, cacheRefreshPending: false });
  expect(slugs).toEqual([["due"]]);
  const state = await pg.query<{ slug: string; is_hidden: boolean; scheduled_publish_at: string | null }>("SELECT slug,is_hidden,scheduled_publish_at FROM manga ORDER BY slug");
  expect(state.rows.find(row => row.slug === "due")).toMatchObject({ is_hidden: false, scheduled_publish_at: null });
  expect(state.rows.filter(row => row.is_hidden).map(row => row.slug)).toEqual(["draft", "future"]);
  expect(await publishScheduledManga(database, () => { throw new Error("No cache work expected"); })).toEqual({ published: 0, cacheRefreshPending: false });
  expect((await pg.query<{ fresh: boolean }>("SELECT created_at > '2020-01-02' AS fresh FROM manga WHERE slug='due'")).rows[0].fresh).toBe(true);
});
it("retries publication invalidation after a cache failure without losing its timestamp", async () => {
  expect((await publishScheduledManga(database, () => false)).cacheRefreshPending).toBe(true);
  expect((await pg.query<{ scheduled_publish_at: unknown }>("SELECT scheduled_publish_at FROM manga WHERE slug='due'")).rows[0].scheduled_publish_at).not.toBeNull();
  expect((await publishScheduledManga(database, () => true)).cacheRefreshPending).toBe(false);
  expect((await pg.query<{ scheduled_publish_at: unknown }>("SELECT scheduled_publish_at FROM manga WHERE slug='due'")).rows[0].scheduled_publish_at).toBeNull();
});
it("does not clear a schedule that another admin replaced during cache invalidation", async () => {
  const result = await publishScheduledManga(database, () => {
    // Queue a real edit ahead of the acknowledgement query on this isolated connection.
    void pg.exec(`UPDATE manga SET is_hidden=true,scheduled_publish_at=now()+interval '2 days' WHERE id='${id}'`);
    return true;
  });
  expect(result.cacheRefreshPending).toBe(false);
  expect((await pg.query("SELECT is_hidden,scheduled_publish_at > now() AS future FROM manga WHERE slug='due'")).rows[0]).toEqual({ is_hidden: true, future: true });
});
it("bounds each batch to 100 due works", async () => {
  await pg.exec("INSERT INTO manga(slug,scheduled_publish_at,publication_time_zone) SELECT 'batch-'||i,now()-interval '1 minute','UTC' FROM generate_series(1,105)i");
  expect((await publishScheduledManga(database, () => true)).published).toBe(100);
  expect((await publishScheduledManga(database, () => true)).published).toBe(6);
});
