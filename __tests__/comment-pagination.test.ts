import { describe, expect, it } from "vitest";

import {
  getNextCommentCursor,
  parseCommentCursor,
} from "@/lib/comments/pagination";

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
  it("retains Postgres microsecond precision to avoid skipping comments", () => {
    expect(getNextCommentCursor("2026-10-07 01:02:03.123456+00","11111111-1111-4111-8111-111111111111")).toBe("2026-10-07T01:02:03.123456Z|11111111-1111-4111-8111-111111111111");
    const id="11111111-1111-4111-8111-111111111111";
    const first=getNextCommentCursor("2026-10-07T01:02:03.123001Z",id);
    const second=getNextCommentCursor("2026-10-07T01:02:03.123999Z",id);
    expect(first).not.toBe(second);
    expect(first!<second!).toBe(true);
  });
});
