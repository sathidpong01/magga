import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { resolveExternalUrl } from "@/lib/network-security";

export const METADATA_MAX_BYTES = 512 * 1024;
export const METADATA_TIMEOUT_MS = 5000;
export async function fetchMetadataHtml(input: string, signal = AbortSignal.timeout(METADATA_TIMEOUT_MS), redirects = 3): Promise<{ url: URL; html: string }> {
  // This deadline includes DNS, redirects and the body, rather than resetting
  // after each response header. A late DNS result never starts a connection.
  signal.throwIfAborted();
  const resolved = await Promise.race([
    resolveExternalUrl(input),
    new Promise<never>((_, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    }),
  ]);
  signal.throwIfAborted();
  if (!resolved.valid) throw new Error(resolved.error);
  return new Promise((resolve, reject) => {
    const transport = resolved.url.protocol === "https:" ? httpsRequest : httpRequest;
    const address = resolved.addresses[0];
    const req = transport(resolved.url, {
      signal, agent: false, family: address.family,
      // Connect to the already checked address. Host header and TLS SNI continue
      // to use the URL hostname; a second DNS answer cannot rebind the socket.
      lookup: (_hostname, _options, callback) => callback(null, address.address, address.family),
      headers: { Accept: "text/html,application/xhtml+xml", "Accept-Encoding": "identity", "User-Agent": "Magga-Link-Metadata/1.0" },
    }, response => {
      const status = response.statusCode ?? 500;
      if (status >= 300 && status < 400) {
        const location = response.headers.location;
        response.destroy();
        if (!location || redirects <= 0) return reject(new Error("Invalid metadata redirect"));
        fetchMetadataHtml(new URL(location, resolved.url).toString(), signal, redirects - 1).then(resolve, reject);
        return;
      }
      if (status < 200 || status >= 300 || !/^(text\/html|application\/xhtml\+xml)(;|$)/i.test(response.headers["content-type"] || "")) {
        response.destroy(); return resolve({ url: resolved.url, html: "" });
      }
      if (Number(response.headers["content-length"] || 0) > METADATA_MAX_BYTES || (response.headers["content-encoding"] && response.headers["content-encoding"] !== "identity")) {
        response.destroy(); return reject(new Error("Metadata body exceeds budget"));
      }
      const chunks: Buffer[] = []; let bytes = 0;
      response.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > METADATA_MAX_BYTES) { response.destroy(); reject(new Error("Metadata body exceeds budget")); }
        else chunks.push(chunk);
      });
      response.on("end", () => resolve({ url: resolved.url, html: Buffer.concat(chunks).toString("utf8") }));
      response.on("error", reject);
    });
    req.on("error", reject); req.end();
  });
}
