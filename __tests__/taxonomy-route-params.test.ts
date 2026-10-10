import { describe, expect, it, mock } from "bun:test";
import { getDynamicParam } from "next/dist/shared/lib/router/utils/get-dynamic-param";
import { decodeTaxonomyPageParam } from "@/lib/taxonomy-route-param";

const lookedUpNames: string[] = [];
mock.module("@/lib/manga-list", () => ({
  getMangasByCategoryName: async (name: string) => {
    lookedUpNames.push(name);
    return { name, mangas: [] };
  },
  getMangasByTagName: async (name: string) => {
    lookedUpNames.push(name);
    return { name, mangas: [] };
  },
}));
mock.module("@/app/components/features/manga/MangaCard", () => ({ default: () => null }));

const categoryRoute = await import("@/app/category/[categoryName]/page");
const tagRoute = await import("@/app/tag/[tagName]/page");

describe("installed Next taxonomy Page and metadata parameter contract", () => {
  for (const name of ["Test category", "หมวดหมู่ ไทย", "100%", "literal%20name", "literal%25name"]) {
    it(`looks up the same exact name from encoded Page params and decoded metadata: ${name}`, async () => {
      lookedUpNames.length = 0;
      // Actual installed Next helper used by create-component-tree for Page params.
      const categoryParam = getDynamicParam({ categoryName: name }, "categoryName", "d", null, null).value;
      const tagParam = getDynamicParam({ tagName: name }, "tagName", "d", null, null).value;
      if (typeof categoryParam !== "string" || typeof tagParam !== "string") throw new Error("Expected scalar Next params");
      await categoryRoute.default({ params: Promise.resolve({ categoryName: categoryParam }) });
      await tagRoute.default({ params: Promise.resolve({ tagName: tagParam }) });
      // resolve-metadata passes interpolatedParams directly, without getDynamicParam encoding.
      const categoryMetadata = await categoryRoute.generateMetadata({ params: Promise.resolve({ categoryName: name }) });
      const tagMetadata = await tagRoute.generateMetadata({ params: Promise.resolve({ tagName: name }) });
      expect(lookedUpNames).toEqual([name, name, name, name]);
      expect(categoryMetadata.alternates?.canonical).toBe(`/category/${encodeURIComponent(name)}`);
      expect(tagMetadata.alternates?.canonical).toBe(`/tag/${encodeURIComponent(name)}`);
    });
  }

  it("keeps malformed encoded input literal without throwing", () => {
    expect(decodeTaxonomyPageParam("unknown%")).toBe("unknown%");
    expect(decodeTaxonomyPageParam("%E0%A4%A")).toBe("%E0%A4%A");
  });
});
