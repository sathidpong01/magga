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
  headers = new Map<string, string>();
  setRequestHeader(name: string, value: string) { this.headers.set(name, value); }
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
    expect(requests[0].headers.get("X-Upload-Id")).toBe("cover-1");
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
    expect(requests[1].headers.get("X-Upload-Id")).toBe(requests[0].headers.get("X-Upload-Id"));
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
  it("rejects unsupported or oversized selections without starting a request", async () => {
    const { uploader, requests } = fixture();
    await expect(uploader.upload("invalid", new File(["svg"], "cover.svg", { type: "image/svg+xml" }))).rejects.toThrow("รองรับเฉพาะ");
    await expect(uploader.upload("huge", new File([new Uint8Array(4 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }))).rejects.toThrow("4 MiB");
    expect(requests).toHaveLength(0);
  });
});
