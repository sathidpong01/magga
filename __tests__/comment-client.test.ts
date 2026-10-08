import { stubGlobal, restoreGlobals } from "./helpers/globals";
import { afterEach, describe, expect, it, jest } from "bun:test";
import { commentRequest } from "../app/components/features/comments/request";
afterEach(() => restoreGlobals());
describe("comment client HTTP recovery and privacy", () => {
  it("bypasses shared caches for personal ownership reads even if a caller requests caching", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(Response.json({ capabilities: {} }));
    stubGlobal("fetch", fetchMock);
    await expect(
      commentRequest("/api/comments/me", { cache: "force-cache" }),
    ).resolves.toEqual({ capabilities: {} });
    expect(fetchMock.mock.calls[0][1].cache).toBe("no-store");
  });
  it("surfaces server rejection and preserves the submitted body for a successful retry", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        Response.json({ error: "กรุณายืนยันก่อนส่ง" }, { status: 403 }),
      )
      .mockResolvedValueOnce(Response.json({ comment: { id: "saved" } }));
    stubGlobal("fetch", fetchMock);
    const init = {
      method: "POST",
      body: JSON.stringify({ content: "ทดสอบ", idempotencyKey: "same-key" }),
    };
    await expect(commentRequest("/api/comments", init)).rejects.toThrow(
      "กรุณายืนยันก่อนส่ง",
    );
    await expect(commentRequest("/api/comments", init)).resolves.toEqual({
      comment: { id: "saved" },
    });
    expect(fetchMock.mock.calls[0][1].body).toBe(
      fetchMock.mock.calls[1][1].body,
    );
  });
  it("turns a proxy HTML failure into a recoverable error instead of leaking a JSON parse diagnostic", async () => {
    stubGlobal(
      "fetch",
      jest
        .fn()
        .mockResolvedValue(
          new Response("<html>Gateway error</html>", { status: 502 }),
        ),
    );
    await expect(commentRequest("/api/comments")).rejects.toThrow(
      "ระบบตอบกลับไม่สมบูรณ์",
    );
  });
  it("explains network loss and permits retry without modifying the file FormData", async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(Response.json({ assetId: "asset" }));
    stubGlobal("fetch", fetchMock);
    const body = new FormData();
    body.append("file", new Blob(["test"]), "test.png");
    await expect(
      commentRequest("/api/comments/upload", { method: "POST", body }),
    ).rejects.toThrow("เชื่อมต่อไม่ได้");
    await expect(
      commentRequest("/api/comments/upload", { method: "POST", body }),
    ).resolves.toEqual({ assetId: "asset" });
    expect(body.get("file")).not.toBeNull();
    expect(fetchMock.mock.calls[1][1].body).toBe(body);
  });
});
