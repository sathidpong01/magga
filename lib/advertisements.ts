export const adDevices = ["all", "mobile", "desktop"] as const;
export const adPlacements = ["grid", "header", "footer", "manga-end", "floating", "modal"] as const;

export const maxAdvertisementLinks = 20;

/** Normalize a destination while rejecting browser URL repair and credentials. */
export function normalizeAdvertisementLink(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length > 2048 || !/^https?:\/\/[^/?#]/i.test(trimmed) || /[\s\\\u0000-\u001f\u007f]/u.test(trimmed)) return null;
  if (trimmed.split("/")[2].split(/[?#]/)[0].includes("@")) return null;
  try {
    const url = new URL(trimmed);
    if (!url.hostname || url.username || url.password) return null;
    return url.href.length <= 2048 ? url.href : null;
  } catch {
    return null;
  }
}

type AdvertisementLinks = { linkUrls?: string[] | null; linkUrl?: string | null };

export function getAdvertisementLinks(ad: AdvertisementLinks): string[] {
  const candidates = Array.isArray(ad.linkUrls) && ad.linkUrls.length ? ad.linkUrls : ad.linkUrl ? [ad.linkUrl] : [];
  return [...new Set(candidates.filter((value): value is string => typeof value === "string").map(normalizeAdvertisementLink).filter((url): url is string => url !== null))].slice(0, maxAdvertisementLinks);
}

/** Call once per advertisement per document load; each destination has equal probability. */
export function chooseAdvertisementLink(ad: AdvertisementLinks, random: () => number = Math.random): string | null {
  const links = getAdvertisementLinks(ad);
  if (!links.length) return null;
  const sample = random();
  const index = Number.isFinite(sample) ? Math.min(links.length - 1, Math.max(0, Math.floor(sample * links.length))) : 0;
  return links[index];
}

export function adDeviceDisplay(device?: string) {
  return device === "mobile" ? { xs: "block", md: "none" }
    : device === "desktop" ? { xs: "none", md: "block" } : "block";
}

export function adCtr(impressions: number, clicks: number) {
  return impressions > 0 ? (clicks / impressions * 100).toFixed(2) : "0.00";
}
