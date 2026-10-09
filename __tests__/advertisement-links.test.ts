import { describe, expect, it } from "bun:test";
import { advertisementInput, advertisementUpdate } from "@/lib/advertisement-input";
import { chooseAdvertisementLink, getAdvertisementLinks } from "@/lib/advertisements";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const base = { type: "affiliate", title: "Campaign", imageUrl: "/ad.webp", placement: "grid" };

describe("advertisement destinations", () => {
  it("normalizes and deduplicates URLs while keeping order", () => {
    expect(advertisementInput.parse({ ...base, linkUrls: [" HTTPS://EXAMPLE.COM:443 ", "https://example.com/", "https://example.org/a"] }))
      .toMatchObject({ linkUrls: ["https://example.com/", "https://example.org/a"], linkUrl: "https://example.com/" });
  });
  it.each(["javascript:alert(1)", "data:text/html,hi", "//example.com", "https://user:pass@example.com", "https://@example.com", "https://example.com\\evil", "https://exa\nmple.com", "https:///example.com", "https://"])("rejects unsafe destination %s", (link) => {
    expect(advertisementInput.safeParse({ ...base, linkUrls: [link] }).success).toBe(false);
    expect(getAdvertisementLinks({ linkUrl: link })).toEqual([]);
  });
  it("accepts zero to twenty links and rejects excess and non-string entries", () => {
    expect(advertisementInput.parse({ ...base }).linkUrls).toEqual([]);
    expect(advertisementInput.parse({ ...base, linkUrls: [] }).linkUrl).toBeNull();
    const links = Array.from({ length: 20 }, (_, i) => `https://example.com/${i}`);
    expect(advertisementInput.parse({ ...base, linkUrls: links }).linkUrls).toEqual(links);
    expect(advertisementInput.safeParse({ ...base, linkUrls: [...links, links[0]] }).success).toBe(false);
    expect(advertisementInput.safeParse({ ...base, linkUrls: [42] }).success).toBe(false);
    expect(advertisementInput.safeParse({ ...base, linkUrls: null }).success).toBe(false);
  });
  it("supports old input and gives an explicit new array precedence", () => {
    expect(advertisementUpdate.parse({ linkUrl: " https://example.com " })).toEqual({ linkUrl: "https://example.com/", linkUrls: ["https://example.com/"] });
    expect(advertisementUpdate.parse({ linkUrls: [], linkUrl: "javascript:ignored" })).toEqual({ linkUrls: [], linkUrl: null });
    expect(advertisementUpdate.parse({ linkUrl: " " })).toEqual({ linkUrl: null, linkUrls: [] });
    expect(advertisementUpdate.parse({ isActive: false })).toEqual({ isActive: false });
  });
  it("falls back to a safe legacy URL for old rows", () => {
    expect(getAdvertisementLinks({ linkUrl: "https://example.com", linkUrls: null })).toEqual(["https://example.com/"]);
    expect(getAdvertisementLinks({ linkUrl: "https://example.com", linkUrls: [] })).toEqual(["https://example.com/"]);
  });
  it("chooses each destination in equally sized intervals and samples once", () => {
    const ad = { linkUrls: ["https://one.example/", "https://two.example/", "https://three.example/"] };
    let calls = 0;
    expect(chooseAdvertisementLink(ad, () => { calls++; return 0; })).toBe(ad.linkUrls[0]);
    expect(calls).toBe(1);
    expect(chooseAdvertisementLink(ad, () => 1 / 3)).toBe(ad.linkUrls[1]);
    expect(chooseAdvertisementLink(ad, () => 2 / 3)).toBe(ad.linkUrls[2]);
    expect(chooseAdvertisementLink(ad, () => 0.999999)).toBe(ad.linkUrls[2]);
    expect(chooseAdvertisementLink(ad, () => 1)).toBe(ad.linkUrls[2]);
    expect(chooseAdvertisementLink({}, () => { throw new Error("must not sample"); })).toBeNull();
  });
});

it("backfills legacy rows without modifying old data and is safe to reapply", async () => {
  const client = new PGlite();
  try {
    await client.exec("CREATE TABLE advertisements (id integer PRIMARY KEY, link_url text, title text, is_active boolean);");
    const legacy = [" https://example.com/path?a=1 ", "javascript:alert(1)", "https://user:pass@example.com", null];
    for (const [id, link] of legacy.entries()) await client.query("INSERT INTO advertisements VALUES ($1, $2, 'untouched', true)", [id, link]);
    const sql = readFileSync("db/migrations/0014_advertisement_links.sql", "utf8");
    await client.exec(sql);
    const { rows } = await client.query<{ id: number; link_url: string | null; link_urls: string[]; title: string; is_active: boolean }>("SELECT * FROM advertisements ORDER BY id");
    expect(rows.map((row) => row.link_url)).toEqual(legacy);
    expect(rows.map((row) => row.link_urls)).toEqual([["https://example.com/path?a=1"], [], [], []]);
    expect(rows.every((row) => row.title === "untouched" && row.is_active)).toBe(true);
    await client.exec("UPDATE advertisements SET link_urls = '[]'::jsonb WHERE id = 0;");
    await client.exec(sql);
    expect((await client.query<{ link_urls: string[] }>("SELECT link_urls FROM advertisements WHERE id = 0")).rows[0].link_urls).toEqual([]);
  } finally {
    await client.close();
  }
});
