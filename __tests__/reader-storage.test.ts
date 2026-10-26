import { describe, expect, it } from "bun:test";
import {
  getCommentDraft,
  setCommentDraft,
  readingEntries,
  saveReadingEntry,
} from "@/lib/reader-storage";
import {
  getBrowseSnapshot,
  saveBrowseSnapshot,
} from "@/lib/browse-restoration";
function storage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
    clear: () => map.clear(),
    key: (index) => [...map.keys()][index] ?? null,
  };
}
describe("bounded device-local reader state", () => {
  it("expires drafts and separates account, work and reply scopes", () => {
    const s = storage();
    setCommentDraft(s, "member:a:work:reply", "ร่าง", "", 1000);
    expect(getCommentDraft(s, "member:a:work:reply", 2000)?.content).toBe(
      "ร่าง",
    );
    expect(getCommentDraft(s, "member:b:work:reply", 2000)).toBeUndefined();
    expect(getCommentDraft(s, "member:a:work:root", 2000)).toBeUndefined();
    expect(getCommentDraft(s, "member:a:work:reply", 86401001)).toBeUndefined();
    setCommentDraft(s, "member:a:work:reply", "", "", 2000);
    expect(getCommentDraft(s, "member:a:work:reply", 2000)).toBeUndefined();
  });
  it("bounds drafts by count and UTF-8 size and tolerates corrupt or blocked storage", () => {
    const s = storage();
    for (let i = 0; i < 30; i++)
      setCommentDraft(s, String(i), "ก".repeat(500), "", Date.now() + i);
    expect(
      Object.keys(JSON.parse(s.getItem("magga_comment_drafts_v1")!)),
    ).toHaveLength(20);
    expect(
      new TextEncoder().encode(s.getItem("magga_comment_drafts_v1")!)
        .byteLength,
    ).toBeLessThanOrEqual(50000);
    s.setItem("magga_comment_drafts_v1", "corrupt");
    expect(getCommentDraft(s, "a")).toBeUndefined();
    const blocked = {
      ...s,
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(() => setCommentDraft(blocked, "a", "text", "")).not.toThrow();
  });
  it("keeps legacy progress while rejecting invalid entries and bounding history", () => {
    const s = storage();
    s.setItem(
      "magga_reading_progress",
      JSON.stringify({
        legacy: { page: 1, totalPages: 4, timestamp: 1 },
        invalid: { page: -1, totalPages: 4, timestamp: 1 },
      }),
    );
    expect(Object.keys(readingEntries(s))).toEqual(["legacy"]);
    for (let i = 0; i < 105; i++)
      saveReadingEntry(s, String(i), {
        page: 1,
        totalPages: 5,
        timestamp: 10 + i,
        title: "Test",
        slug: "test",
      });
    expect(Object.keys(readingEntries(s))).toHaveLength(100);
    expect(readingEntries(s).legacy).toBeUndefined();
  });
  it("expires navigation state, isolates scopes and refuses out-of-budget batches", () => {
    const s = storage();
    const now = Date.now();
    const state = {
      mangas: [],
      page: 3,
      hasMore: true,
      scrollY: 1700,
      timestamp: now,
    };
    saveBrowseSnapshot(s, "guest:query", state);
    expect(getBrowseSnapshot(s, "guest:query", now)?.scrollY).toBe(1700);
    expect(getBrowseSnapshot(s, "member:query", now)).toBeUndefined();
    expect(getBrowseSnapshot(s, "guest:query", now + 600001)).toBeUndefined();
    saveBrowseSnapshot(s, "guest:query", { ...state, page: 6 });
    expect(getBrowseSnapshot(s, "guest:query", now)).toBeUndefined();
  });
});
