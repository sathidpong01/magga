import { lookup } from "dns/promises";
import { isIP } from "net";

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "169.254.169.254",
  "metadata.google.internal",
]);

const BLOCKED_SUFFIXES = [".internal", ".local", ".localhost"];
const ALLOWED_PORTS = new Set(["", "80", "443"]);

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

export function isPrivateIpAddress(address: string) {
  const normalized = address.trim().toLowerCase();
  const version = isIP(normalized);

  if (version === 4) {
    return isPrivateIpv4(normalized);
  }

  if (version !== 6) {
    return false;
  }

  if (
    normalized === "::" ||
    normalized === "::1" ||
    normalized === "0:0:0:0:0:0:0:1"
  ) {
    return true;
  }

  if (normalized.startsWith("::ffff:")) {
    return isPrivateIpv4(normalized.slice(7));
  }

  return (
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  );
}

export function getClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function validateExternalUrl(urlString: string) {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(urlString);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return { valid: false, error: "Only HTTP(S) protocols are allowed" };
  }

  if (parsedUrl.username || parsedUrl.password) {
    return { valid: false, error: "Embedded credentials are not allowed" };
  }

  if (!ALLOWED_PORTS.has(parsedUrl.port)) {
    return { valid: false, error: "Only default HTTP/HTTPS ports are allowed" };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (
    BLOCKED_HOSTS.has(hostname) ||
    BLOCKED_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
  ) {
    return { valid: false, error: "Access to this host is not allowed" };
  }

  if (isIP(hostname)) {
    if (isPrivateIpAddress(hostname)) {
      return { valid: false, error: "Access to private IP ranges is not allowed" };
    }

    return { valid: true, url: parsedUrl };
  }

  try {
    const addresses = await lookup(hostname, { all: true, verbatim: true });

    if (addresses.length === 0) {
      return { valid: false, error: "Unable to resolve hostname" };
    }

    if (addresses.some(({ address }) => isPrivateIpAddress(address))) {
      return { valid: false, error: "Access to private IP ranges is not allowed" };
    }
  } catch {
    return { valid: false, error: "Unable to resolve hostname" };
  }

  return { valid: true, url: parsedUrl };
}
