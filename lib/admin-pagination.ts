export type AdminSearchParams = Record<string, string | string[] | undefined>;
export type AdminPageQuery = {
  page: number;
  limit: number;
  search: string;
  sort: string;
  status: string;
};
export function adminPageQuery(params: AdminSearchParams = {}): AdminPageQuery {
  const value = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string) : "";
  const page = Number(value("page") || 1);
  return {
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 10000) : 1,
    limit: value("limit") === "50" ? 50 : 20,
    search: value("search").trim().slice(0, 120),
    sort: value("sort"),
    status: value("status"),
  };
}
export function pageSlice<T>(rows: T[], query: AdminPageQuery) {
  return {
    items: rows.slice(0, query.limit),
    hasMore: rows.length > query.limit,
    page: query.page,
    limit: query.limit,
  };
}
export function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}
