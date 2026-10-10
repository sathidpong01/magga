export const MANGA_SORTS = ["added", "updated", "az"] as const;
export type MangaSort = (typeof MANGA_SORTS)[number];
export const EMPTY_CATEGORY_ID = "00000000-0000-0000-0000-000000000000";
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeMangaSort(value?: string | null): MangaSort {
  return MANGA_SORTS.includes(value as MangaSort) ? value as MangaSort : "added";
}

export function normalizeFilterNames(values: readonly string[] = []) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort().slice(0, 50);
}

export function normalizeHomeFilters(input: Record<string, string | string[] | undefined>) {
  const first = (key: string) => {
    const value = input[key];
    return (Array.isArray(value) ? value[0] : value)?.trim();
  };
  const tags = input.tags;
  return {
    search: first("search")?.slice(0, 200) || undefined,
    category: first("category")?.slice(0, 100) || undefined,
    tags: normalizeFilterNames(Array.isArray(tags) ? tags : tags ? [tags] : []).map((name) => name.slice(0, 100)),
    sort: normalizeMangaSort(first("sort")),
    author: first("author")?.slice(0, 100) || undefined,
  };
}

export function normalizeMangaQuery(input: {
  page?: number; pageSize?: number; search?: string; categoryId?: string;
  tagNames?: string[]; sort?: string; excludeTagIds?: string[]; author?: string;
}) {
  return {
    page: Number.isSafeInteger(input.page) ? Math.min(Math.max(input.page!, 1), 10_000) : 1,
    pageSize: Number.isSafeInteger(input.pageSize) ? Math.min(Math.max(input.pageSize!, 1), 24) : 12,
    search: input.search?.trim().slice(0, 200) || undefined,
    categoryId: input.categoryId && input.categoryId !== "all"
      ? UUID_PATTERN.test(input.categoryId) ? input.categoryId.toLowerCase() : EMPTY_CATEGORY_ID
      : undefined,
    tagNames: normalizeFilterNames(input.tagNames).map((name) => name.slice(0, 100)),
    sort: normalizeMangaSort(input.sort),
    excludeTagIds: normalizeFilterNames(input.excludeTagIds).filter((id) => UUID_PATTERN.test(id)).map((id) => id.toLowerCase()),
    author: input.author?.trim().slice(0, 100) || undefined,
  };
}

/** Repeated parameters preserve commas inside a tag name. */
export function buildMangaPageQuery(input: {
  page: number; pageSize: number; search?: string; categoryId?: string;
  tagNames?: string[]; sort?: string; author?: string;
}) {
  const query = normalizeMangaQuery(input);
  const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) });
  if (query.search) params.set("search", query.search);
  if (query.categoryId) params.set("categoryId", query.categoryId);
  if (query.author) params.set("author", query.author);
  for (const name of query.tagNames) params.append("tags", name);
  if (query.sort !== "added") params.set("sort", query.sort);
  return params;
}

export function appendUniqueMangas<T extends { id: string }>(previous: T[], incoming: T[]): T[] {
  const seen = new Set(previous.map((item) => item.id));
  return [...previous, ...incoming.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  })];
}

export function buildSearchFilterUrl(input: {
  search: string; category: string; sort: string; tagNames: string[]; author?: string | null;
}) {
  const params = new URLSearchParams();
  const search = input.search.trim().slice(0, 200);
  if (input.author) params.set("author", input.author);
  if (search) params.set("search", search);
  if (input.category && input.category !== "all") params.set("category", input.category);
  const sort = normalizeMangaSort(input.sort);
  if (sort !== "added") params.set("sort", sort);
  for (const name of normalizeFilterNames(input.tagNames)) params.append("tags", name);
  return params.size ? `/?${params}` : "/";
}

/** ILIKE treats user punctuation literally, including '%' and '_'. */
export function literalSearchPattern(value: string) {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}
