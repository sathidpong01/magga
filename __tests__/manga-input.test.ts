import { expect, it } from "bun:test";
import { mangaInputSchema, bulkMangaSchema, mangaPublicationValues } from "@/lib/manga-input";
const id = "10000000-0000-4000-8000-000000000001";
it("rejects malformed foreign keys and deduplicates tag IDs before a transaction", () => {
  expect(mangaInputSchema.safeParse({ title: "Title", slug: "title", selectedTags: ["bad"] }).success).toBe(false);
  expect(mangaInputSchema.parse({ title: "Title", slug: "title", selectedTags: [id, id] }).selectedTags).toEqual([id]);
});
it("validates future absolute instants and the admin time zone", () => {
  const input = { title: "Title", slug: "title", selectedTags: [], scheduledPublishAt: "2099-01-01T19:00:00+07:00", publicationTimeZone: "Asia/Bangkok" };
  expect(mangaPublicationValues(mangaInputSchema.parse(input))).toEqual({ isHidden: true, scheduledPublishAt: "2099-01-01T12:00:00.000Z", publicationTimeZone: "Asia/Bangkok" });
  for (const changes of [
    { scheduledPublishAt: "2000-01-01T00:00:00Z" },
    { scheduledPublishAt: "2099-01-01T19:00:00" },
    { scheduledPublishAt: "invalid" },
    { publicationTimeZone: "Mars/Olympus" },
    { publicationTimeZone: null },
    { isHidden: false },
    { scheduledPublishAt: null },
  ]) expect(mangaInputSchema.safeParse({ ...input, ...changes }).success).toBe(false);
});
it("preserves schedules on ordinary edits and cancels them on explicit visibility actions", () => {
  const input = { title: "Title", slug: "title", selectedTags: [] };
  expect(mangaPublicationValues(mangaInputSchema.parse(input))).toEqual({});
  for (const isHidden of [true, false]) expect(mangaPublicationValues(mangaInputSchema.parse({ ...input, isHidden }))).toEqual({ isHidden, scheduledPublishAt: null, publicationTimeZone: null });
  expect(mangaPublicationValues(mangaInputSchema.parse({ ...input, scheduledPublishAt: null }))).toEqual({ isHidden: true, scheduledPublishAt: null, publicationTimeZone: null });
});
it("bounds bulk operations and defines explicit target actions", () => {
  expect(bulkMangaSchema.safeParse({ ids: Array(201).fill(id), action: "hide" }).success).toBe(false);
  expect(bulkMangaSchema.safeParse({ ids: [id], action: "toggle" }).success).toBe(false);
  expect(bulkMangaSchema.parse({ ids: [id, id], action: "hide" }).ids).toEqual([id]);
});
