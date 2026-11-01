import { afterAll, beforeAll, beforeEach, expect, it } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { cleanupMangaUploads, storeMangaUpload } from "@/lib/storage/manga-uploads";
import { MemoryStorageAdapter } from "@/lib/storage";
import { ASSET_POLICIES } from "@/lib/storage/policies";
import sharp from "sharp";

const pg = new PGlite();
const database = drizzle(pg);
const uploadId = "10000000-0000-4000-8000-000000000001";
let storage: MemoryStorageAdapter;
let png: Buffer;
const file = () => new File([new Uint8Array(png)], "page.png", { type: "image/png" });
const upload = (userId = "owner", id = uploadId) => storeMangaUpload(database, storage, { userId, uploadId: id, file: file() });
async function expire() { await pg.exec("UPDATE manga_uploads SET expires_at = now() - interval '1 day'"); }
beforeAll(async () => {
  png = await sharp({ create: { width: 3, height: 4, channels: 4, background: "red" } }).png().toBuffer();
  await pg.exec(`CREATE TABLE manga(id serial PRIMARY KEY, cover_image text NOT NULL, pages jsonb NOT NULL);
    CREATE TABLE manga_submissions(id serial PRIMARY KEY, cover_image text NOT NULL, pages text NOT NULL);`);
  await pg.exec(await Bun.file(new URL("../db/migrations/0017_manga_upload_lifecycle.sql", import.meta.url)).text());
}, 30000);
beforeEach(async () => {
  await pg.exec("TRUNCATE manga, manga_submissions, manga_uploads");
  storage = new MemoryStorageAdapter("https://cdn.example/assets");
});
afterAll(() => pg.close());

it("reuses acknowledged and lost-response uploads, while separating owners and rejecting changed bytes", async () => {
  const first = await upload();
  expect(await upload()).toEqual(first);
  expect(storage.size).toBe(1);
  const another = await upload("other-owner");
  expect(another.url).not.toBe(first.url);
  const otherPng = await sharp(png).negate().png().toBuffer();
  await expect(storeMangaUpload(database, storage, { userId: "owner", uploadId, file: new File([otherPng], "other.png", { type: "image/png" }) })).rejects.toThrow("ไฟล์อื่น");
  expect(storage.size).toBe(2);
  const [state] = (await pg.query<{ width: number; height: number }>("SELECT width,height FROM manga_uploads LIMIT 1")).rows;
  expect(state).toEqual({ width: 3, height: 4 });
});
it("retries an ambiguous storage write using exactly the same key and bytes", async () => {
  const original = storage.put.bind(storage);
  let writes = 0;
  const keys: string[] = [];
  storage.put = async (key, bytes, type) => { keys.push(key); await original(key, bytes, type); if (++writes === 1) throw new Error("lost acknowledgement"); };
  await expect(upload()).rejects.toThrow("lost acknowledgement");
  expect((await pg.query("SELECT state FROM manga_uploads")).rows).toEqual([{ state: "pending" }]);
  await upload();
  expect(keys[0]).toBe(keys[1]);
  expect(storage.size).toBe(1);
  expect(storage.get(keys[0])?.body).toEqual(new Uint8Array(png));
});
it("cleans abandoned uploads but protects drafts, submissions, object pages and external images", async () => {
  const abandoned = await upload();
  const cover = await upload("draft");
  const page = await upload("page");
  const submission = await upload("submission");
  await pg.query("INSERT INTO manga(cover_image,pages) VALUES ($1,$2)", [cover.url, JSON.stringify([{ url: page.url, width: 3 }])]);
  await pg.query("INSERT INTO manga_submissions(cover_image,pages) VALUES ($1,$2)", ["https://external.example/cover.png", JSON.stringify([submission.url])]);
  await storage.put("legacy/keep.png", png, "image/png");
  await expire();
  expect(await cleanupMangaUploads(database, storage)).toBe(1);
  expect(storage.size).toBe(4);
  expect((await pg.query("SELECT state FROM manga_uploads WHERE url=$1", [abandoned.url])).rows).toEqual([{ state: "retired" }]);
  expect(await cleanupMangaUploads(database, storage)).toBe(0);
  await pg.exec("DELETE FROM manga; DELETE FROM manga_submissions");
  expect(await cleanupMangaUploads(database, storage)).toBe(3);
  expect(storage.has("legacy/keep.png")).toBe(true);
});
it("retains failed deletion records and forbids attaching or resurrecting retired URLs", async () => {
  const asset = await upload();
  await expire();
  const original = storage.delete.bind(storage);
  storage.delete = async () => { throw new Error("storage unavailable"); };
  await expect(cleanupMangaUploads(database, storage)).rejects.toThrow("storage unavailable");
  await expect(pg.query("INSERT INTO manga(cover_image,pages) VALUES ($1,'[]')", [asset.url])).rejects.toThrow("not available");
  await expect(pg.query("INSERT INTO manga_submissions(cover_image,pages) VALUES ('external',$1)", [JSON.stringify([asset.url])])).rejects.toThrow("not available");
  await expect(upload()).rejects.toThrow("หมดอายุ");
  storage.delete = original;
  expect(await cleanupMangaUploads(database, storage)).toBe(1);
  expect(storage.size).toBe(0);
  expect(await cleanupMangaUploads(database, storage)).toBe(0);
  await expect(pg.query("INSERT INTO manga(cover_image,pages) VALUES ($1,'[]')", [asset.url])).rejects.toThrow("not available");
});
it("does not remove active uploads and forbids attaching unfinished uploads", async () => {
  const original = storage.put.bind(storage);
  storage.put = async () => { throw new Error("interrupted"); };
  await expect(upload()).rejects.toThrow("interrupted");
  const [pending] = (await pg.query<{ url: string }>("SELECT url FROM manga_uploads")).rows;
  await expect(pg.query("INSERT INTO manga(cover_image,pages) VALUES ($1,'[]')", [pending.url])).rejects.toThrow("not available");
  expect(await cleanupMangaUploads(database, storage)).toBe(0);
  storage.put = original;
  await upload();
  expect(await cleanupMangaUploads(database, storage)).toBe(0);
});
it("rejects fake headers, truncated images and excessive dimensions without writing storage", async () => {
  for (const bytes of [Buffer.from([0x89, 0x50, 0x4e, 0x47]), png.subarray(0, 40)]) {
    await expect(storeMangaUpload(database, storage, { userId: "owner", uploadId, file: new File([new Uint8Array(bytes)], "bad.png", { type: "image/png" }) })).rejects.toThrow("รูปภาพไม่ถูกต้อง");
  }
  const giant = await sharp({ create: { width: 10000, height: 5000, channels: 3, background: "white" } }).png().toBuffer();
  await expect(ASSET_POLICIES["manga-page"].process(new File([giant], "giant.png", { type: "image/png" }), { kind: "manga-page", mangaId: "fixture" })).rejects.toThrow();
  expect(storage.size).toBe(0);
  expect((await pg.query("SELECT count(*)::int AS count FROM manga_uploads")).rows).toEqual([{ count: 0 }]);
});

it("decodes every advertised format and preserves original bytes and dimensions", async () => {
  const fixtures = [
    { type: "image/jpeg", bytes: await sharp(png).jpeg().toBuffer() },
    { type: "image/png", bytes: png },
    { type: "image/webp", bytes: await sharp(png).webp().toBuffer() },
    { type: "image/gif", bytes: await sharp(png).gif().toBuffer() },
    { type: "image/avif", bytes: await sharp(png).avif().toBuffer() },
  ];
  for (const fixture of fixtures) {
    const asset = await ASSET_POLICIES["manga-page"].process(new File([new Uint8Array(fixture.bytes)], "image", { type: fixture.type }), { kind: "manga-page", mangaId: "fixture" });
    expect(asset.data).toEqual(new Uint8Array(fixture.bytes));
    expect([asset.width, asset.height]).toEqual([3, 4]);
  }
});

it("preserves every frame of an animated image without transcoding", async () => {
  const pixels = Buffer.concat([Buffer.alloc(3 * 4 * 3, 0), Buffer.alloc(3 * 4 * 3, 255)]);
  const animated = await sharp(pixels, { raw: { width: 3, height: 8, channels: 3, pageHeight: 4 } }).gif({ loop: 0, delay: [100, 100] }).toBuffer();
  expect((await sharp(animated, { animated: true }).metadata()).pages).toBe(2);
  const asset = await ASSET_POLICIES["manga-page"].process(new File([new Uint8Array(animated)], "animated.gif", { type: "image/gif" }), { kind: "manga-page", mangaId: "fixture" });
  expect(asset.data).toEqual(new Uint8Array(animated));
  expect(asset.height).toBe(4);
});
