import { describe, expect, it } from "bun:test";
import { DraftFileUploader } from "@/lib/storage/client-upload";

class FakeRequest {
  upload = { onprogress: null as ((event: ProgressEvent) => void) | null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  onabort: (() => void) | null = null;
  timeout = 0;
  withCredentials = false;
  status = 200;
  responseText = JSON.stringify({ urls: ["https://images.example/cover.webp"] });
  sent: FormData | null = null;
  open() {}
  send(body: FormData) { this.sent = body; }
  abort() { this.onabort?.(); }
}
function fixture() {
  const requests: FakeRequest[] = [];
  const uploader = new DraftFileUploader(() => {
    const request = new FakeRequest(); requests.push(request);
    return request as unknown as XMLHttpRequest;
  });
  return { uploader, requests, file: new File(["image"], "cover.webp", { type: "image/webp" }) };
}

describe("draft upload checkpoint and lifecycle", () => {
  it("joins concurrent retries and reuses an acknowledged URL after a later save failure", async () => {
    const { uploader, requests, file } = fixture();
    const first = uploader.upload("cover-1", file);
    expect(uploader.upload("cover-1", file)).toBe(first);
    expect(requests).toHaveLength(1);
    expect(requests[0].timeout).toBe(120_000);
    expect(requests[0].withCredentials).toBe(true);
    requests[0].onload!();
    expect(await first).toBe("https://images.example/cover.webp");
    expect(await uploader.upload("cover-1", file)).toBe("https://images.example/cover.webp");
    expect(requests).toHaveLength(1);
  });
  it("retries a failed upload without reusing an unacknowledged result", async () => {
    const { uploader, requests, file } = fixture();
    const first = uploader.upload("page-1", file);
    requests[0].ontimeout!();
    await expect(first).rejects.toThrow("หมดเวลา");
    const retry = uploader.upload("page-1", file);
    expect(requests).toHaveLength(2);
    requests[1].onload!();
    expect(await retry).toContain("cover.webp");
  });
  it("aborts pending uploads and rejects queued uploads after form teardown", async () => {
    const { uploader, requests, file } = fixture();
    const operation = uploader.upload("page-1", file);
    uploader.abortAll();
    await expect(operation).rejects.toThrow("ยกเลิก");
    await expect(uploader.upload("page-2", file)).rejects.toThrow("ยกเลิก");
    expect(requests).toHaveLength(1);
  });
  it("does not checkpoint a malformed successful response", async () => {
    const { uploader, requests, file } = fixture();
    const operation = uploader.upload("page-1", file);
    requests[0].responseText = "{}";
    requests[0].onload!();
    await expect(operation).rejects.toThrow("รูปแบบข้อมูล");
    const retry = uploader.upload("page-1", file);
    requests[1].onload!();
    await retry;
  });
});
