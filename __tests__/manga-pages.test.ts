import { describe, expect, it } from "bun:test";
import { normalizeMangaPages, withMangaPageDimensions } from "@/lib/manga-pages";

describe("reader page dimensions", () => {
  it("resolves legacy URLs in order and reuses dimensions for repeated pages", () => {
    const pages = normalizeMangaPages(["/one.webp", "/two.webp", "/one.webp"]);
    expect(withMangaPageDimensions(pages, [
      { url: "/two.webp", width: 1200, height: 800 },
      { url: "/one.webp", width: 800, height: 2400 },
    ])).toEqual([
      { url: "/one.webp", width: 800, height: 2400 },
      { url: "/two.webp", width: 1200, height: 800 },
      { url: "/one.webp", width: 800, height: 2400 },
    ]);
    expect(pages).toEqual([{ url: "/one.webp" }, { url: "/two.webp" }, { url: "/one.webp" }]);
  });

  it("preserves complete page metadata and replaces partial pairs together", () => {
    const pages = [{ url: "/known.webp", width: 600, height: 900 }, { url: "/partial.webp", width: 123 }];
    expect(withMangaPageDimensions(pages, [
      { url: "/known.webp", width: 999, height: 999 },
      { url: "/partial.webp", width: 1200, height: 800 },
    ])).toEqual([pages[0], { url: "/partial.webp", width: 1200, height: 800 }]);
  });

  it("keeps unknown pages readable and ignores unusable upload dimensions", () => {
    const pages = normalizeMangaPages(["/zero.webp", "/invalid.webp", "/unknown.webp"]);
    expect(withMangaPageDimensions(pages, [
      { url: "/zero.webp", width: 0, height: 100 },
      { url: "/invalid.webp", width: 200, height: Number.NaN },
    ])).toEqual(pages);
  });
});
