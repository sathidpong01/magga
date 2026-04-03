const DEFAULT_PRODUCTION_SITE_URL = "https://magga.vercel.app";
const DEFAULT_LOCAL_SITE_URL = "http://localhost:3000";

function normalizeSiteUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function getConfiguredSiteUrl(): string | null {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_URL;

  if (!configured) {
    return null;
  }

  return normalizeSiteUrl(configured);
}

function getLocalSiteUrl(): string {
  const explicitLocalUrl = process.env.NEXT_PUBLIC_DEV_APP_URL;

  if (explicitLocalUrl) {
    return normalizeSiteUrl(explicitLocalUrl);
  }

  const port = process.env.PORT || process.env.NEXT_PUBLIC_DEV_PORT || "3000";
  return normalizeSiteUrl(`http://localhost:${port}`);
}

export function getSiteUrl(): string {
  if (process.env.NODE_ENV !== "production") {
    return getLocalSiteUrl();
  }

  return getConfiguredSiteUrl() || DEFAULT_PRODUCTION_SITE_URL;
}

export function getAuthBaseUrl(): string {
  return getSiteUrl();
}

export function getTrustedOrigins(): string[] {
  const origins = new Set<string>([DEFAULT_LOCAL_SITE_URL]);
  const configured = getConfiguredSiteUrl();

  if (configured) {
    origins.add(configured);
  }

  if (process.env.NODE_ENV !== "production") {
    origins.add(getLocalSiteUrl());
  } else {
    origins.add(DEFAULT_PRODUCTION_SITE_URL);
  }

  return Array.from(origins);
}
