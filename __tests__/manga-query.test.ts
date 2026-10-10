import { describe, expect, it } from "bun:test";
import { appendUniqueMangas, buildMangaPageQuery, buildSearchFilterUrl, EMPTY_CATEGORY_ID, literalSearchPattern, normalizeHomeFilters, normalizeMangaQuery } from "@/lib/manga-query";

describe("public browsing filter contract", () => {
  it("preserves commas in repeated tags across page boundaries", () => {
    const params = buildMangaPageQuery({ page: 2, pageSize: 12, tagNames: ["A,B", "ไทย", "A,B"] });
    expect(new URLSearchParams(params.toString()).getAll("tags")).toEqual(["A,B", "ไทย"]);
    expect(params.has("excludeTagIds")).toBe(false);
  });

  it("normalizes equivalent filter permutations before caching", () => {
    expect(normalizeMangaQuery({ tagNames: [" B ", "A", "A"], search: " test ", sort: "random" }))
      .toEqual(normalizeMangaQuery({ tagNames: ["A", "B"], search: "test", sort: "added" }));
  });

  it("bounds hostile pagination and invalid categories without broadening to all manga", () => {
    const query = normalizeMangaQuery({ page: Number.MAX_SAFE_INTEGER, pageSize: 99999, categoryId: "bad", search: "x".repeat(1000) });
    expect(query.page).toBe(10000);
    expect(query.pageSize).toBe(24);
    expect(query.categoryId).toBe(EMPTY_CATEGORY_ID);
    expect(query.search?.length).toBe(200);
    expect(normalizeMangaQuery({ page: NaN }).page).toBe(1);
  });

  it("keeps author context on an explicit search or filter commit", () => {
    const url = buildSearchFilterUrl({ search: "  cats  ", category: "ไทย%", sort: "updated", tagNames: ["A,B"], author: "artist" });
    const params = new URL(url, "https://example.test").searchParams;
    expect(params.get("search")).toBe("cats");
    expect(params.get("author")).toBe("artist");
    expect(params.get("category")).toBe("ไทย%");
    expect(params.getAll("tags")).toEqual(["A,B"]);
  });

  it("deduplicates overlapping pages without deleting existing rows or changing order", () => {
    expect(appendUniqueMangas([{ id: "a" }], [{ id: "a" }, { id: "b" }, { id: "b" }, { id: "c" }])).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
  });

  it("treats wildcard punctuation as literal search text", () => {
    expect(literalSearchPattern("50%_\\")).toBe("%50\\%\\_\\\\%");
  });

  it("handles repeated scalar URL parameters while preserving repeated tag names", () => {
    expect(normalizeHomeFilters({ search: [" cats ", "ignored"], category: ["ไทย%", "ignored"], tags: ["A,B", "B"], sort: ["random", "az"] }))
      .toEqual({ search: "cats", category: "ไทย%", tags: ["A,B", "B"], sort: "added", author: undefined });
  });
});
