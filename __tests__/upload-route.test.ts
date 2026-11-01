import { beforeEach, expect, it, jest, mock } from "bun:test";
import { MangaUploadError } from "@/lib/storage/manga-uploads";
import { MANGA_UPLOAD_MAX_BODY_BYTES } from "@/lib/manga-upload-policy";
const auth = jest.fn();
const rate = jest.fn();
const store = jest.fn();
mock.module("@/db", () => ({ db: {} }));
mock.module("@/lib/auth-helpers", () => ({ authenticateRequest: auth }));
mock.module("@/lib/rate-limit", () => ({ checkRateLimit: rate }));
mock.module("@/lib/storage", () => ({ getDefaultStorageAdapter: () => ({}) }));
mock.module("@/lib/storage/manga-uploads", () => ({ MangaUploadError, storeMangaUpload: store }));
const { POST } = await import("@/app/api/upload/route");
const uploadId = "10000000-0000-4000-8000-000000000001";
function request(files: File[] = [new File(["image"], "page.png", { type: "image/png" })]) {
  const body = new FormData();
  for (const file of files) body.append("files", file);
  return new Request("http://localhost/api/upload", { method: "POST", body, headers: { "X-Upload-Id": uploadId } });
}
beforeEach(() => {
  auth.mockReset().mockResolvedValue({ ok: true, caller: { user: { id: "member", role: "user" } } });
  rate.mockReset().mockResolvedValue({ allowed: true });
  store.mockReset().mockResolvedValue({ url: "https://cdn.example/page.png", width: 20, height: 30 });
});
it("authenticates and passes a single file and stable owner-scoped ID to storage", async () => {
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ urls: [{ url: "https://cdn.example/page.png", width: 20, height: 30 }] });
  expect(store.mock.calls[0][2]).toMatchObject({ userId: "member", uploadId, file: expect.any(File) });
  expect(rate.mock.calls[0][3]).toEqual({ failClosed: true });
});
it("rejects unauthenticated callers before storage", async () => {
  auth.mockResolvedValue({ ok: false, response: new Response(null, { status: 401 }) });
  expect((await POST(request())).status).toBe(401);
  expect(store).not.toHaveBeenCalled();
});
it("rejects missing upload IDs, multiple files, unsupported images and oversized files", async () => {
  const noId = request(); noId.headers.delete("x-upload-id");
  expect((await POST(noId)).status).toBe(400);
  expect((await POST(request([new File(["a"], "a.png", { type: "image/png" }), new File(["b"], "b.png", { type: "image/png" })]))).status).toBe(400);
  expect((await POST(request([new File(["svg"], "a.svg", { type: "image/svg+xml" })]))).status).toBe(400);
  expect((await POST(request([new File([new Uint8Array(MANGA_UPLOAD_MAX_BODY_BYTES)], "huge.png", { type: "image/png" })]))).status).toBe(413);
  expect(store).not.toHaveBeenCalled();
});
it("bounds streamed bodies even when content-length is absent", async () => {
  const body = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(MANGA_UPLOAD_MAX_BODY_BYTES + 1)); controller.close(); } });
  const req = new Request("http://localhost/api/upload", { method: "POST", body, headers: { "x-upload-id": uploadId, "content-type": "multipart/form-data; boundary=x" } });
  expect((await POST(req)).status).toBe(413);
  expect(store).not.toHaveBeenCalled();
});
it("returns rate limits and typed storage errors without exposing internal errors", async () => {
  rate.mockResolvedValueOnce({ allowed: false });
  expect((await POST(request())).status).toBe(429);
  store.mockRejectedValueOnce(new MangaUploadError("conflict", 409));
  expect((await POST(request())).status).toBe(409);
  store.mockRejectedValueOnce(new Error("private storage detail"));
  const response = await POST(request());
  expect(response.status).toBe(500);
  expect(JSON.stringify(await response.json())).not.toContain("private storage detail");
});
