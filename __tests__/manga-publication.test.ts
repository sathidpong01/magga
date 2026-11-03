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
  await pg.exec("CREATE SCHEMA private; INSERT INTO manga(slug,is_hidden,created_at,updated_at) VALUES ('legacy-hidden',true,'2019-01-01','2019-01-02')");
  await pg.exec(await Bun.file(new URL("../db/migrations/0018_preserve_manga_publication_date.sql", import.meta.url)).text());
  const [legacy] = (await pg.query<{ publication_date_set: boolean; unchanged: boolean }>("SELECT publication_date_set,updated_at='2019-01-02'::timestamptz AS unchanged FROM manga WHERE slug='legacy-hidden'")).rows;
  expect(legacy).toEqual({ publication_date_set: true, unchanged: true });
  await pg.exec("UPDATE manga SET is_hidden=false,scheduled_publish_at=now()-interval '1 minute',publication_time_zone='UTC' WHERE slug='legacy-hidden'");
  expect((await pg.query<{ original_date: boolean }>("SELECT created_at='2019-01-01'::timestamptz AS original_date FROM manga WHERE slug='legacy-hidden'")).rows[0].original_date).toBe(true);
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
  const [schedule] = (await pg.query<{ scheduled_publish_at: string }>("SELECT scheduled_publish_at::text FROM manga WHERE slug='due'")).rows;
  const slugs: string[][] = [];
  expect(await publishScheduledManga(database, value => { slugs.push(value); return true; })).toEqual({ published: 1, cacheRefreshPending: false });
  expect(slugs).toEqual([["due"]]);
  const state = await pg.query<{ slug: string; is_hidden: boolean; scheduled_publish_at: string | null }>("SELECT slug,is_hidden,scheduled_publish_at FROM manga ORDER BY slug");
  expect(state.rows.find(row => row.slug === "due")).toMatchObject({ is_hidden: false, scheduled_publish_at: null });
  expect(state.rows.filter(row => row.is_hidden).map(row => row.slug)).toEqual(["draft", "future"]);
  expect(await publishScheduledManga(database, () => { throw new Error("No cache work expected"); })).toEqual({ published: 0, cacheRefreshPending: false });
  expect((await pg.query<{ fresh: boolean }>("SELECT created_at > '2020-01-02' AS fresh FROM manga WHERE slug='due'")).rows[0].fresh).toBe(true);
  expect((await pg.query<{ created_at: string }>("SELECT created_at::text FROM manga WHERE slug='due'")).rows[0].created_at).toBe(schedule.scheduled_publish_at);
});
it("retries publication invalidation after a cache failure without losing its timestamp", async () => {
  expect((await publishScheduledManga(database, () => false)).cacheRefreshPending).toBe(true);
  expect((await pg.query<{ scheduled_publish_at: unknown }>("SELECT scheduled_publish_at FROM manga WHERE slug='due'")).rows[0].scheduled_publish_at).not.toBeNull();
  expect((await publishScheduledManga(database, () => true)).cacheRefreshPending).toBe(false);
  expect((await pg.query<{ scheduled_publish_at: unknown }>("SELECT scheduled_publish_at FROM manga WHERE slug='due'")).rows[0].scheduled_publish_at).toBeNull();
});
it("preserves the original post date when a published work is scheduled again", async () => {
  await pg.exec("UPDATE manga SET is_hidden=true,scheduled_publish_at=now()-interval '1 minute',publication_time_zone='Asia/Bangkok' WHERE slug='published'");
  await publishScheduledManga(database, () => true);
  expect((await pg.query<{ original_date: boolean; is_hidden: boolean }>("SELECT created_at='2020-01-01'::timestamptz AS original_date,is_hidden FROM manga WHERE slug='published'")).rows[0])
    .toEqual({ original_date: true, is_hidden: false });
});
it("preserves the first release date across hide, cancellation, rescheduling and cache retries", async () => {
  await publishScheduledManga(database, () => true);
  const [first] = (await pg.query<{ created_at: string }>("SELECT created_at::text FROM manga WHERE slug='due'")).rows;
  await pg.exec("UPDATE manga SET is_hidden=true WHERE slug='due'; UPDATE manga SET scheduled_publish_at=now()+interval '1 day',publication_time_zone='UTC' WHERE slug='due'; UPDATE manga SET scheduled_publish_at=null,publication_time_zone=null WHERE slug='due'; UPDATE manga SET scheduled_publish_at=now()-interval '5 seconds',publication_time_zone='UTC' WHERE slug='due'");
  await publishScheduledManga(database, () => false);
  await publishScheduledManga(database, () => true);
  expect((await pg.query<{ created_at: string }>("SELECT created_at::text FROM manga WHERE slug='due'")).rows[0].created_at).toBe(first.created_at);
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
it("sets the date on a draft's first manual publication, then preserves it on hide/show", async () => {
  await pg.exec("UPDATE manga SET is_hidden=false WHERE slug='draft'");
  expect((await pg.query<{ fresh: boolean; established: boolean }>("SELECT created_at>'2020-01-02' AS fresh,publication_date_set AS established FROM manga WHERE slug='draft'")).rows[0])
    .toEqual({ fresh: true, established: true });
  const [first] = (await pg.query<{ created_at: string }>("SELECT created_at::text FROM manga WHERE slug='draft'")).rows;
  await pg.exec("UPDATE manga SET is_hidden=true WHERE slug='draft'; UPDATE manga SET is_hidden=false WHERE slug='draft'");
  expect((await pg.query<{ created_at: string }>("SELECT created_at::text FROM manga WHERE slug='draft'")).rows[0].created_at).toBe(first.created_at);
});
