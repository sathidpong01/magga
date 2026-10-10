import { expect, it } from "bun:test";
import { mangaInputSchema, bulkMangaSchema } from "@/lib/manga-input";
const id = "10000000-0000-4000-8000-000000000001";
it("rejects malformed foreign keys and deduplicates tag IDs before a transaction", () => {
  expect(mangaInputSchema.safeParse({ title: "Title", slug: "title", selectedTags: ["bad"] }).success).toBe(false);
  expect(mangaInputSchema.parse({ title: "Title", slug: "title", selectedTags: [id, id] }).selectedTags).toEqual([id]);
});
it("bounds bulk operations and defines explicit target actions", () => {
  expect(bulkMangaSchema.safeParse({ ids: Array(201).fill(id), action: "hide" }).success).toBe(false);
  expect(bulkMangaSchema.safeParse({ ids: [id], action: "toggle" }).success).toBe(false);
  expect(bulkMangaSchema.parse({ ids: [id, id], action: "hide" }).ids).toEqual([id]);
});
