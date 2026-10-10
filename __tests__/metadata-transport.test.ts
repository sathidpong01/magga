import { describe, expect, it, mock } from "bun:test";
import { EventEmitter } from "node:events";
let mode: "normal" | "oversize" | "redirect-private" | "slow" = "normal";
let lookups = 0, connections = 0;
mock.module("@/lib/network-security", () => ({ resolveExternalUrl: async (input: string) => {
  lookups++;
  const url = new URL(input);
  if (url.hostname === "127.0.0.1") return { valid: false, error: "Private address" };
  return { valid: true, url, addresses: [{ address: "8.8.8.8", family: 4 }] };
} }));
function transport(url: URL, options: any, callback: (response: any) => void) {
  connections++;
  expect(url.hostname).toBe("fixture.example");
  expect(options.agent).toBe(false);
  options.lookup(url.hostname, {}, (error: unknown, address: string, family: number) => {
    expect(error).toBeNull(); expect(address).toBe("8.8.8.8"); expect(family).toBe(4);
  });
  const req: any = new EventEmitter();
  req.end = () => queueMicrotask(() => {
    if (mode === "slow") { options.signal.addEventListener("abort", () => req.emit("error", new Error("deadline")), { once: true }); return; }
    const response: any = new EventEmitter();
    response.statusCode = mode === "redirect-private" ? 302 : 200;
    response.headers = { "content-type": "text/html", ...(mode === "redirect-private" ? { location: "http://127.0.0.1/private" } : {}) };
    response.destroy = () => { response.destroyed = true; };
    callback(response);
    if (!response.destroyed) {
      response.emit("data", mode === "oversize" ? Buffer.alloc(512 * 1024 + 1) : Buffer.from("<title>Fixture</title>"));
      if (!response.destroyed) response.emit("end");
    }
  });
  return req;
}
mock.module("node:http", () => ({ request: transport }));
mock.module("node:https", () => ({ request: transport }));
const { fetchMetadataHtml } = await import("../lib/metadata-fetch");
describe("bounded pinned metadata transport", () => {
  it("connects through the checked address and preserves hostname", async () => {
    mode = "normal"; lookups = 0; connections = 0;
    const result = await fetchMetadataHtml("https://fixture.example/path");
    expect(result.html).toBe("<title>Fixture</title>"); expect(lookups).toBe(1); expect(connections).toBe(1);
  });
  it("rejects an oversized streamed body", async () => {
    mode = "oversize";
    await expect(fetchMetadataHtml("https://fixture.example/path")).rejects.toThrow("budget");
  });
  it("checks redirects before a second connection", async () => {
    mode = "redirect-private"; connections = 0;
    await expect(fetchMetadataHtml("https://fixture.example/path")).rejects.toThrow("Private address");
    expect(connections).toBe(1);
  });
  it("keeps the deadline active while waiting for response headers", async () => {
    mode = "slow";
    await expect(fetchMetadataHtml("https://fixture.example/path", AbortSignal.timeout(20))).rejects.toThrow("deadline");
  });
});
