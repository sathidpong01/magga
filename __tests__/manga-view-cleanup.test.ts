import { afterAll, beforeAll, expect, it, mock } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type { SQL } from "drizzle-orm";

const pg = new PGlite();
const database = drizzle(pg);
mock.module("@/lib/storage/manga-uploads", () => ({ cleanupMangaUploads: async () => 0 }));
mock.module("@/lib/storage", () => ({ getDefaultStorageAdapter: () => ({}) }));
mock.module("@/db", () => ({ db: {
  execute: async (query: SQL) => (await database.execute(query)).rows,
  delete: database.delete.bind(database), select: database.select.bind(database),
} }));
const { GET } = await import("@/app/api/cron/cleanup/route");
const oldSecret = process.env.CRON_SECRET;
beforeAll(async () => {
  process.env.CRON_SECRET = "view-marker-fixture";
  await pg.exec(`CREATE TABLE login_attempts(identifier text PRIMARY KEY,count int,expires_at timestamptz);
    CREATE TABLE manga_submissions(status text,updated_at timestamptz);
    CREATE TABLE advertisement_events(event_id uuid,created_at timestamptz);
    CREATE TABLE manga_views(manga_id uuid,ip_hash text,viewed_at timestamptz);
    CREATE TABLE manga(view_count bigint);
    CREATE TABLE manga_view_daily(views bigint);
    INSERT INTO manga VALUES(100); INSERT INTO manga_view_daily VALUES(25);
    INSERT INTO manga_views VALUES
      (gen_random_uuid(),'expired',now()-INTERVAL '2 days'),
      (gen_random_uuid(),'active',now()-INTERVAL '5 minutes'),
      (gen_random_uuid(),'recent',now()-INTERVAL '11 minutes');`);
}, 30000);
afterAll(async () => {
  if (oldSecret === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = oldSecret;
  await pg.close();
});

it("expires old view markers while preserving recent markers and all aggregate counts", async () => {
  const run = () => GET(new Request("http://localhost/api/cron/cleanup", { headers: { authorization: "Bearer view-marker-fixture" } }));
  const first = await run();
  expect(first.status).toBe(200);
  expect((await first.json()).viewMarkersDeleted).toBe(1);
  expect((await pg.query("SELECT ip_hash FROM manga_views ORDER BY ip_hash")).rows).toEqual([{ ip_hash: "active" }, { ip_hash: "recent" }]);
  expect((await pg.query("SELECT view_count::int FROM manga")).rows).toEqual([{ view_count: 100 }]);
  expect((await pg.query("SELECT views::int FROM manga_view_daily")).rows).toEqual([{ views: 25 }]);
  expect((await (await run()).json()).viewMarkersDeleted).toBe(0);
});
