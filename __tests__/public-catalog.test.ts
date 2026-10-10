import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { NextRequest } from "next/server";
import * as schema from "@/db/schema";
import * as relations from "@/db/relations";

// Disposable, in-memory SQL only. Do not import the application DB or env files.
const client = new PGlite();
const database = drizzle(client, { schema: { ...schema, ...relations } });
const entries = new Map<string, { value: unknown; tags: string[] }>();
const refreshedPaths: string[] = [];
let failTagRefresh = false;
mock.module("server-only", () => ({}));
mock.module("@/db", () => ({ db: database }));
mock.module("next/cache", () => ({
  unstable_cache: (fn: (...args: any[]) => Promise<unknown>, keys: string[], options: { tags?: string[] }) => async (...args: any[]) => {
    const key = JSON.stringify([keys, args]);
    if (entries.has(key)) return entries.get(key)!.value;
    const value = await fn(...args);
    entries.set(key, { value, tags: options.tags ?? [] });
    return value;
  },
  revalidateTag: (tag: string, options: { expire: number }) => {
    expect(options).toEqual({ expire: 0 });
    if (failTagRefresh && tag === "manga-list") throw new Error("synthetic cache outage");
    for (const [key, entry] of entries) if (entry.tags.includes(tag)) entries.delete(key);
  },
  revalidatePath: (path: string) => { refreshedPaths.push(path); },
}));

const { getMangasWithPagination, getMangasByTagName, getMangasByCategoryName } = await import("@/lib/manga-list");
const { invalidateMangaContent } = await import("@/lib/manga-invalidation");
const { GET: listGET } = await import("@/app/api/manga/list/route");
const { GET: searchGET } = await import("@/app/api/search/route");
const id = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;

await client.exec(`
  CREATE TABLE categories (id uuid PRIMARY KEY, name text NOT NULL);
  CREATE TABLE tags (id uuid PRIMARY KEY, name text NOT NULL);
  CREATE TABLE authors (id uuid PRIMARY KEY, name text NOT NULL, profile_url text, social_links text);
  CREATE TABLE manga (
    id uuid PRIMARY KEY, slug text NOT NULL, title text NOT NULL, description text,
    cover_image text NOT NULL DEFAULT 'https://example.test/cover.webp', view_count integer NOT NULL DEFAULT 0,
    average_rating real NOT NULL DEFAULT 0, category_id uuid, author_id uuid, author_name text,
    is_hidden boolean NOT NULL DEFAULT false, created_at timestamp NOT NULL DEFAULT '2026-01-01',
    updated_at timestamp NOT NULL DEFAULT '2026-01-01', fts tsvector
  );
  CREATE TABLE manga_tags (manga_id uuid NOT NULL, tag_id uuid NOT NULL);
  CREATE TABLE manga_contributors (manga_id uuid NOT NULL, author_id uuid NOT NULL);
`);

beforeEach(async () => {
  entries.clear(); refreshedPaths.length = 0; failTagRefresh = false;
  await client.exec("TRUNCATE manga_tags, manga_contributors, manga, categories, tags, authors");
  await client.query("INSERT INTO categories VALUES ($1, $2)", [id(100), "100%ไทย"]);
  await client.query("INSERT INTO tags VALUES ($1, $2)", [id(200), "A,B"]);
  await client.query("INSERT INTO authors VALUES ($1, $2, NULL, NULL), ($3, $4, NULL, NULL)", [id(300), "Artist_100%", id(301), "Contributor"]);
  for (let index = 1; index <= 9; index++) {
    await client.query("INSERT INTO manga (id, slug, title, category_id, author_id, author_name, is_hidden, fts) VALUES ($1,$2,$3,$4,$5,$6,$7,to_tsvector('english',$3))", [id(index), `manga-${index}`, "same title", id(100), id(300), "stale author name", index === 9]);
    await client.query("INSERT INTO manga_tags VALUES ($1,$2)", [id(index), id(200)]);
  }
  await client.query("INSERT INTO manga_contributors VALUES ($1,$2)", [id(1), id(301)]);
});
afterAll(() => client.close());

describe("public catalog SQL and cache dependencies", () => {
  it("has stable ordering across equal timestamps, with a consistent raw dataset on every page", async () => {
    const first = await getMangasWithPagination(1, 3);
    const second = await getMangasWithPagination(2, 3);
    const third = await getMangasWithPagination(3, 3);
    const rows = [...first.mangas, ...second.mangas, ...third.mangas];
    expect(rows.map((manga) => manga.id)).toEqual([8, 7, 6, 5, 4, 3, 2, 1].map(id));
    expect(third.hasMore).toBe(false);
    expect(rows.every((manga) => manga.authorName === "Artist_100%")).toBe(true);
  });

  it("preserves comma tag names and ignores client exclude filters so page two cannot skip public rows", async () => {
    const response = await listGET(new Request(`http://localhost/api/manga/list?page=2&pageSize=3&tags=A%2CB&excludeTagIds=${id(200)}`));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect((await response.json()).mangas.map((manga: { id: string }) => manga.id)).toEqual([5, 4, 3].map(id));
  });

  it("rejects invalid UUID filters and unsupported sorts rather than issuing a database error", async () => {
    for (const query of ["categoryId=invalid", "sort=random", `tags=${"x".repeat(101)}`]) {
      expect((await listGET(new Request(`http://localhost/api/manga/list?${query}`))).status).toBe(400);
    }
  });

  it("matches a linked author, contributor and literal wildcard punctuation", async () => {
    expect((await getMangasWithPagination(1, 12, undefined, undefined, undefined, undefined, undefined, "Artist_100%")).mangas).toHaveLength(8);
    expect((await getMangasWithPagination(1, 12, "Artist_100%")).mangas).toHaveLength(8);
    expect((await getMangasWithPagination(1, 12, "Artist_100_" )).mangas).toHaveLength(0);
    expect((await getMangasWithPagination(1, 12, "Contributor")).mangas.map((manga) => manga.id)).toEqual([id(1)]);
  });

  it("does not broaden an unknown category to the complete catalog", async () => {
    expect((await getMangasWithPagination(1, 12, undefined, "not-a-uuid")).mangas).toHaveLength(0);
  });

  it("expires warmed list, search and taxonomy data immediately when content is withdrawn", async () => {
    const list = await getMangasWithPagination(1, 12);
    await getMangasByCategoryName("100%ไทย");
    await getMangasByTagName("A,B");
    expect((await (await searchGET(new NextRequest("http://localhost/api/search?q=Contributor"))).json())).toHaveLength(1);
    await client.query("UPDATE manga SET is_hidden = true WHERE id=$1", [id(1)]);
    expect(list.mangas).toHaveLength(8);
    expect(invalidateMangaContent(["manga-1"])).toBe(true);
    expect((await getMangasWithPagination(1, 12)).mangas).toHaveLength(7);
    expect((await getMangasByCategoryName("100%ไทย"))?.mangas).toHaveLength(7);
    expect((await getMangasByTagName("A,B"))?.mangas).toHaveLength(7);
    expect(await (await searchGET(new NextRequest("http://localhost/api/search?q=Contributor"))).json()).toEqual([]);
    expect(refreshedPaths).toContain("/tag/[tagName]");
    expect(refreshedPaths).toContain("/category/[categoryName]");
    expect(refreshedPaths).toContain("/[mangaId]");
    expect(refreshedPaths).toContain("/sitemap.xml");
  });

  it("invalidates a cached negative taxonomy lookup after creation or rename", async () => {
    expect(await getMangasByTagName("new%ไทย")).toBeNull();
    await client.query("UPDATE tags SET name=$1 WHERE id=$2", ["new%ไทย", id(200)]);
    invalidateMangaContent();
    expect((await getMangasByTagName("new%ไทย"))?.mangas).toHaveLength(8);
    expect(await getMangasByTagName("A,B")).toBeNull();
  });

  it("returns author-only suggestions without a category or invented tags field", async () => {
    await client.query("UPDATE manga SET category_id = NULL WHERE id=$1", [id(1)]);
    const response = await searchGET(new NextRequest("http://localhost/api/search?q=Contributor"));
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const results = await response.json();
    expect(results).toHaveLength(1);
    expect(results[0].category).toBe("");
    expect(results[0].authorName).toBe("Artist_100%");
  });

  it("keeps invalidating remaining dependencies and reports a cache refresh outage", () => {
    failTagRefresh = true;
    expect(invalidateMangaContent()).toBe(false);
    expect(refreshedPaths).toContain("/sitemap.xml");
  });
});
