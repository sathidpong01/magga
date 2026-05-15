const STANDALONE_ROUTE_PREFIXES = ["/dashboard", "/moxzk"] as const;

function normalizePathname(pathname: string | null | undefined) {
  return pathname?.toLowerCase() ?? "";
}

function matchesRoutePrefix(pathname: string, routePrefix: string) {
  return pathname === routePrefix || pathname.startsWith(`${routePrefix}/`);
}

export function isStandaloneRoute(pathname: string | null | undefined) {
  const normalizedPathname = normalizePathname(pathname);

  return STANDALONE_ROUTE_PREFIXES.some((routePrefix) =>
    matchesRoutePrefix(normalizedPathname, routePrefix)
  );
}

export function isMoxzkRoute(pathname: string | null | undefined) {
  return matchesRoutePrefix(normalizePathname(pathname), "/moxzk");
}
