const DEFAULT_PRODUCTION_SITE_URL = "https://magga.vercel.app";
const DEFAULT_LOCAL_SITE_URL = "http://localhost:3000";
const DEFAULT_VERCEL_HOST_PATTERN = "*.vercel.app";
const SITE_URL_ENV_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "BETTER_AUTH_URL",
  "AUTH_URL",
  "NEXTAUTH_URL",
] as const;

function normalizeSiteUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function getConfiguredSiteUrls(): string[] {
  const urls = new Set<string>();

  for (const key of SITE_URL_ENV_KEYS) {
    const value = process.env[key];
    if (!value) {
      continue;
    }

    urls.add(normalizeSiteUrl(value));
  }

  if (process.env.VERCEL_URL) {
    urls.add(normalizeSiteUrl(process.env.VERCEL_URL));
  }

  return Array.from(urls);
}

function getConfiguredSiteUrl(): string | null {
  return getConfiguredSiteUrls()[0] ?? null;
}

function getLocalSiteUrl(): string {
  const explicitLocalUrl = process.env.NEXT_PUBLIC_DEV_APP_URL;

  if (explicitLocalUrl) {
    return normalizeSiteUrl(explicitLocalUrl);
  }

  const port = process.env.PORT || process.env.NEXT_PUBLIC_DEV_PORT || "3000";
  return normalizeSiteUrl(`http://localhost:${port}`);
}

function getUrlOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function getUrlHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function parseOriginList(rawValue?: string): string[] {
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeHostPattern(value: string): string | null {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return null;
  }

  if (trimmed.includes("://")) {
    return getUrlHost(trimmed);
  }

  return trimmed.replace(/^https?:\/\//, "").split("/")[0] || null;
}

function getLocalHosts(): string[] {
  const localSiteUrl = getLocalSiteUrl();
  const localHost = getUrlHost(localSiteUrl);
  const localPort = new URL(localSiteUrl).port || "3000";
  const hosts = new Set<string>(["localhost:3000", "127.0.0.1:3000"]);

  if (localHost) {
    hosts.add(localHost);
  }

  hosts.add(`127.0.0.1:${localPort}`);
  return Array.from(hosts);
}

export function getSiteUrl(): string {
  if (process.env.NODE_ENV !== "production") {
    return getLocalSiteUrl();
  }

  return getConfiguredSiteUrl() || DEFAULT_PRODUCTION_SITE_URL;
}

export function getAuthBaseUrl() {
  if (process.env.NODE_ENV !== "production") {
    return getLocalSiteUrl();
  }

  const allowedHosts = new Set<string>(getLocalHosts());

  for (const siteUrl of getConfiguredSiteUrls()) {
    const host = getUrlHost(siteUrl);
    if (host) {
      allowedHosts.add(host);
    }
  }

  for (const origin of parseOriginList(process.env.BETTER_AUTH_TRUSTED_ORIGINS)) {
    const hostPattern = normalizeHostPattern(origin);
    if (hostPattern) {
      allowedHosts.add(hostPattern);
    }
  }

  if (process.env.VERCEL === "1") {
    allowedHosts.add(DEFAULT_VERCEL_HOST_PATTERN);
  }

  return {
    allowedHosts: Array.from(allowedHosts),
    fallback: getSiteUrl(),
  };
}

function getRequestOrigin(request: Request): string | null {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

export function getTrustedOrigins(request?: Request): string[] {
  const origins = new Set<string>([DEFAULT_LOCAL_SITE_URL, getLocalSiteUrl()]);

  for (const siteUrl of getConfiguredSiteUrls()) {
    const origin = getUrlOrigin(siteUrl);
    if (origin) {
      origins.add(origin);
    }
  }

  for (const originPattern of parseOriginList(process.env.BETTER_AUTH_TRUSTED_ORIGINS)) {
    origins.add(originPattern);
  }

  if (process.env.VERCEL === "1") {
    origins.add(`https://${DEFAULT_VERCEL_HOST_PATTERN}`);
  }

  if (request) {
    const requestOrigin = getRequestOrigin(request);
    if (requestOrigin) {
      origins.add(requestOrigin);
    }
  }

  if (process.env.NODE_ENV === "production") {
    origins.add(DEFAULT_PRODUCTION_SITE_URL);
  }

  return Array.from(origins);
}
