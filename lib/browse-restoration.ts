import type { MangaWithDetails } from "@/app/components/features/manga/MangaCard";
import { readLocal, writeLocal } from "./reader-storage";
export type BrowseSnapshot = {
  mangas: MangaWithDetails[];
  page: number;
  hasMore: boolean;
  scrollY: number;
  timestamp: number;
};
const KEY = "magga_browse_v1";
let consumedNavigation = false;
export function isBrowseReturn() {
  try {
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem("magga_browse_return") ===
        location.pathname + location.search
    )
      return true;
  } catch {
    /* Disabled storage. */
  }
  return (
    !consumedNavigation &&
    typeof performance !== "undefined" &&
    (
      performance.getEntriesByType("navigation")[0] as
        PerformanceNavigationTiming | undefined
    )?.type === "back_forward"
  );
}
export function consumeBrowseReturn() {
  consumedNavigation = true;
  try {
    sessionStorage.removeItem("magga_browse_return");
  } catch {
    /* Disabled storage. */
  }
}
export function getBrowseSnapshot(
  storage: Storage,
  key: string,
  now = Date.now(),
): BrowseSnapshot | undefined {
  const entry = readLocal<Record<string, BrowseSnapshot>>(storage, KEY, {})?.[
    key
  ];
  if (
    !entry ||
    !Number.isFinite(entry.timestamp) ||
    now - entry.timestamp > 600000 ||
    !Number.isSafeInteger(entry.page) ||
    entry.page < 1 ||
    entry.page > 5 ||
    !Array.isArray(entry.mangas) ||
    entry.mangas.length > 60 ||
    !Number.isFinite(entry.scrollY)
  )
    return;
  if (
    !entry.mangas.every(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.slug === "string" &&
        typeof item.title === "string" &&
        Array.isArray(item.tags),
    )
  )
    return;
  return entry;
}
export function saveBrowseSnapshot(
  storage: Storage,
  key: string,
  entry: BrowseSnapshot,
) {
  const previous = readLocal<Record<string, BrowseSnapshot>>(storage, KEY, {});
  const snapshots = Object.fromEntries(
    Object.entries(
      previous && typeof previous === "object" ? previous : {},
    ).filter(([, value]) => value && Date.now() - value.timestamp < 600000),
  );
  delete snapshots[key];
  if (entry.page <= 5 && entry.mangas.length <= 60) snapshots[key] = entry;
  const entries = Object.entries(snapshots).sort(
    (a, b) => b[1].timestamp - a[1].timestamp,
  );
  while (
    entries.length &&
    new TextEncoder().encode(JSON.stringify(Object.fromEntries(entries)))
      .byteLength > 200000
  )
    entries.pop();
  writeLocal(storage, KEY, Object.fromEntries(entries));
}
