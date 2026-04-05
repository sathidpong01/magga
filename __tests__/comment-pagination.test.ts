import { describe, expect, it } from "vitest";

import {
  getNextCommentCursor,
  parseCommentCursor,
} from "@/lib/comment-pagination";

describe("comment pagination helpers", () => {
  it("parses only valid timestamp cursors", () => {
    expect(parseCommentCursor("2026-04-05T00:00:00.000Z")?.toISOString()).toBe(
      "2026-04-05T00:00:00.000Z"
    );
    expect(parseCommentCursor("comment-id-123")).toBeNull();
    expect(parseCommentCursor(null)).toBeNull();
  });

  it("serializes the next cursor from createdAt values", () => {
    expect(getNextCommentCursor(new Date("2026-04-05T01:02:03.000Z"))).toBe(
      "2026-04-05T01:02:03.000Z"
    );
    expect(getNextCommentCursor("2026-04-05T01:02:03.000Z")).toBe(
      "2026-04-05T01:02:03.000Z"
    );
    expect(getNextCommentCursor("not-a-date")).toBeNull();
  });
});
