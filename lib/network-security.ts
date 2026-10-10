import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal"]);
const BLOCKED_SUFFIXES = [".internal", ".local", ".localhost"];
const ALLOWED_PORTS = new Set(["", "80", "443"]);
function isPrivateIpv4(address: string) {
  const [a, b] = address.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
}
export function isPrivateIpAddress(address: string) {
  const normalized = address.trim().toLowerCase().replace(/^\[|\]$/g, "");
  const version = isIP(normalized);
  if (version === 4) return isPrivateIpv4(normalized);
  if (version !== 6) return false;
  // URL canonicalization converts expanded IPv6 and dotted mapped IPv4 alike.
  const canonical = new URL(`http://[${normalized}]/`).hostname.slice(1, -1);
  if (canonical.startsWith("::ffff:")) {
    const words = canonical.slice(7).split(":").map(word => parseInt(word, 16));
    return isPrivateIpv4(`${words[0] >> 8}.${words[0] & 255}.${words[1] >> 8}.${words[1] & 255}`);
  }
  // Only global-unicast space is fetchable. Reject loopback, unspecified,
  // link-local, unique-local, multicast and transition/translation namespaces.
  const firstWord = parseInt(canonical.split(":")[0] || "0", 16);
  return firstWord < 0x2000 || firstWord >= 0x4000 || canonical.startsWith("2002:") || canonical.startsWith("2001:0:") || canonical.startsWith("2001::");
}
export function getClientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("cf-connecting-ip") || headers.get("x-real-ip") || "unknown";
}
export type ResolvedAddress = { address: string; family: number };
export async function resolveExternalUrl(urlString: string, resolver = lookup): Promise<
  { valid: true; url: URL; addresses: ResolvedAddress[] } | { valid: false; error: string }
> {
  let url: URL;
  try { url = new URL(urlString); } catch { return { valid: false, error: "Invalid URL format" }; }
  if (!["http:", "https:"].includes(url.protocol)) return { valid: false, error: "Only HTTP(S) protocols are allowed" };
  if (url.username || url.password) return { valid: false, error: "Embedded credentials are not allowed" };
  if (!ALLOWED_PORTS.has(url.port)) return { valid: false, error: "Only default HTTP/HTTPS ports are allowed" };
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (BLOCKED_HOSTS.has(hostname) || BLOCKED_SUFFIXES.some(suffix => hostname.endsWith(suffix))) return { valid: false, error: "Access to this host is not allowed" };
  let addresses: ResolvedAddress[];
  try { addresses = isIP(hostname) ? [{ address: hostname, family: isIP(hostname) }] : await resolver(hostname, { all: true, verbatim: true }); }
  catch { return { valid: false, error: "Unable to resolve hostname" }; }
  if (!addresses.length || addresses.some(({ address }) => !isIP(address) || isPrivateIpAddress(address))) return { valid: false, error: "Access to private IP ranges is not allowed" };
  return { valid: true, url, addresses };
}
export async function validateExternalUrl(urlString: string) {
  return resolveExternalUrl(urlString);
}
