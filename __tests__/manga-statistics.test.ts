import { afterAll, beforeAll, expect, it, mock } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
mock.module("@/db", () => ({ db: {} }));
const schema = await import("@/db/schema");
const { recordMangaRating, recordMangaView } = await import("@/lib/manga-statistics");
const pg = new PGlite();
const database = drizzle(pg, { schema });
// Isolated SQL engine, never imports connection configuration or live URLs.
const id = "10000000-0000-4000-8000-000000000001";
beforeAll(async () => {
  await pg.exec(`CREATE TABLE manga (id uuid PRIMARY KEY, is_hidden boolean DEFAULT false, rating_sum bigint DEFAULT 0, rating_count bigint DEFAULT 0, average_rating double precision DEFAULT 0, view_count bigint DEFAULT 0);
    CREATE TABLE manga_ratings (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, manga_id uuid REFERENCES manga(id), fingerprint text, ip_address text, rating integer, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), UNIQUE(manga_id,fingerprint));
    CREATE TABLE manga_views (manga_id uuid REFERENCES manga(id), ip_hash text, viewed_at timestamptz, PRIMARY KEY(manga_id,ip_hash));
    INSERT INTO manga(id) VALUES('${id}');`);
}, 30000);
afterAll(() => pg.close());
const testDatabase = database as unknown as Parameters<typeof recordMangaRating>[0];
it("keeps the aggregate equal to vote rows across new and edited votes", async () => {
  await recordMangaRating(testDatabase, id, 5, "voter-one", "ip");
  await recordMangaRating(testDatabase, id, 3, "voter-two", "ip");
  await recordMangaRating(testDatabase, id, 1, "voter-one", "ip");
  expect((await pg.query("SELECT rating_sum::int AS sum,rating_count::int AS count,average_rating AS average FROM manga")).rows[0]).toEqual({ sum: 4, count: 2, average: 2 });
  expect((await pg.query("SELECT sum(rating)::int AS sum,count(*)::int AS count FROM manga_ratings")).rows[0]).toEqual({ sum: 4, count: 2 });
});
it("deduplicates first touch, the returned cookie and parallel first-touch aliases", async () => {
  expect(await recordMangaView(testDatabase, id, "cookie-one", "first-touch")).toEqual({ viewCount: 1, deduplicated: false });
  expect(await recordMangaView(testDatabase, id, "cookie-one")).toEqual({ viewCount: 1, deduplicated: true });
  expect(await recordMangaView(testDatabase, id, "cookie-two", "first-touch")).toEqual({ viewCount: 1, deduplicated: true });
  expect(await recordMangaView(testDatabase, id, "cookie-two")).toEqual({ viewCount: 1, deduplicated: true });
});
it("rolls back the dedup marker if incrementing fails, so retry can count", async () => {
  await pg.exec("CREATE FUNCTION reject_view() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture failure'; END $$; CREATE TRIGGER fail_view BEFORE UPDATE ON manga FOR EACH ROW EXECUTE FUNCTION reject_view();");
  await expect(recordMangaView(testDatabase, id, "failed-cookie")).rejects.toThrow();
  expect((await pg.query("SELECT ip_hash FROM manga_views WHERE ip_hash='failed-cookie'")).rows).toEqual([]);
  await pg.exec("DROP TRIGGER fail_view ON manga");
  expect(await recordMangaView(testDatabase, id, "failed-cookie")).toEqual({ viewCount: 2, deduplicated: false });
});
it("does not write ratings or view markers for hidden or nonexistent manga", async () => {
  await pg.exec("UPDATE manga SET is_hidden=true");
  expect(await recordMangaRating(testDatabase, id, 5, "hidden-voter", "ip")).toBeNull();
  expect(await recordMangaView(testDatabase, id, "hidden-cookie")).toBeNull();
  expect((await pg.query("SELECT fingerprint FROM manga_ratings WHERE fingerprint='hidden-voter'")).rows).toEqual([]);
});
