/** Bounded, device-local state. Never store credentials, files or private API responses. */
export function readLocal<T>(storage: Storage, key: string, fallback: T): T {
  try {
    return JSON.parse(storage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal(storage: Storage, key: string, value: unknown) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* Storage may be disabled or full. */
  }
}

export type ReadingEntry = {
  page: number;
  totalPages: number;
  timestamp: number;
  title?: string;
  slug?: string;
};
export const READING_KEY = "magga_reading_progress";
export function validReadingEntry(value: unknown): value is ReadingEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as ReadingEntry;
  return (
    Number.isSafeInteger(entry.page) &&
    Number.isSafeInteger(entry.totalPages) &&
    entry.page >= 0 &&
    entry.page < entry.totalPages &&
    Number.isFinite(entry.timestamp)
  );
}
export function readingEntries(storage: Storage) {
  const values = readLocal<Record<string, unknown>>(storage, READING_KEY, {});
  if (!values || typeof values !== "object" || Array.isArray(values)) return {};
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => validReadingEntry(value)),
  ) as Record<string, ReadingEntry>;
}
export function saveReadingEntry(
  storage: Storage,
  id: string,
  entry: ReadingEntry,
) {
  if (!validReadingEntry(entry)) return;
  const entries = { ...readingEntries(storage), [id]: entry };
  const limited = Object.fromEntries(
    Object.entries(entries)
      .sort((a, b) => b[1].timestamp - a[1].timestamp)
      .slice(0, 100),
  );
  writeLocal(storage, READING_KEY, limited);
}

type Draft = { content: string; name: string; timestamp: number };
const DRAFT_KEY = "magga_comment_drafts_v1";
export function getCommentDraft(
  storage: Storage,
  key: string,
  now = Date.now(),
): Draft | undefined {
  const drafts = readLocal<Record<string, Draft>>(storage, DRAFT_KEY, {});
  const draft = drafts?.[key];
  return draft &&
    typeof draft.content === "string" &&
    draft.content.length <= 500 &&
    typeof draft.name === "string" &&
    draft.name.length <= 40 &&
    Number.isFinite(draft.timestamp) &&
    now - draft.timestamp < 86400000
    ? draft
    : undefined;
}
export function setCommentDraft(
  storage: Storage,
  key: string,
  content: string,
  name: string,
  now = Date.now(),
) {
  const stored = readLocal<Record<string, Draft>>(storage, DRAFT_KEY, {});
  const entries = Object.entries(
    stored && typeof stored === "object" ? stored : {},
  ).filter(
    ([, draft]) =>
      draft &&
      Number.isFinite(draft.timestamp) &&
      now - draft.timestamp < 86400000,
  );
  const drafts = Object.fromEntries(entries);
  if (content.trim() || name.trim())
    drafts[key] = {
      content: content.slice(0, 500),
      name: name.slice(0, 40),
      timestamp: now,
    };
  else delete drafts[key];
  const limited = Object.fromEntries(
    Object.entries(drafts)
      .sort((a, b) => b[1].timestamp - a[1].timestamp)
      .slice(0, 20),
  );
  while (new TextEncoder().encode(JSON.stringify(limited)).byteLength > 50000)
    delete limited[Object.keys(limited).at(-1)!];
  writeLocal(storage, DRAFT_KEY, limited);
}
