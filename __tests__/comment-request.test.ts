import { describe, expect, it } from "bun:test";
import { readCommentJson } from "@/lib/comments/request";

describe("bounded comment request bodies", () => {
  it("accepts Thai JSON without relying on content-length", async () => {
    const request = new Request("https://magga.test", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify({ content: "สวัสดี 🦊" }) });
    expect(await readCommentJson(request)).toEqual({ content: "สวัสดี 🦊" });
  });
  it("rejects oversized declared bodies before consuming the stream", async () => {
    const request = new Request("https://magga.test", { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": "9000" }, body: "{}" });
    await expect(readCommentJson(request)).rejects.toMatchObject({ status: 413 });
    expect(request.bodyUsed).toBe(false);
  });
  it("bounds streamed bodies even if content-length is omitted or forged", async () => {
    for (const declared of [undefined, "2"]) {
      const request = new Request("https://magga.test", { method: "POST", headers: { "Content-Type": "application/json", ...(declared ? { "Content-Length": declared } : {}) }, body: JSON.stringify({ content: "ก".repeat(4000) }) });
      await expect(readCommentJson(request)).rejects.toMatchObject({ status: 413 });
    }
  });
  it("rejects malformed JSON and alternative content types", async () => {
    const json = new Request("https://magga.test", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" });
    await expect(readCommentJson(json)).rejects.toMatchObject({ status: 400 });
    const form = new Request("https://magga.test", { method: "POST", body: "content=hello" });
    await expect(readCommentJson(form)).rejects.toMatchObject({ status: 400 });
  });
});
