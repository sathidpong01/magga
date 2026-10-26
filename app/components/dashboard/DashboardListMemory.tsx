"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
const routes = [
  "/dashboard/admin/manga",
  "/dashboard/admin/users",
  "/dashboard/admin/authors",
  "/dashboard/admin/metadata",
  "/dashboard/admin/submissions",
  "/dashboard/admin/comments",
  "/dashboard/submissions",
];
function readReturn(base: string, actor: string | undefined) {
  if (!actor) return;
  try {
    const item = JSON.parse(
      sessionStorage.getItem(`magga_admin_return:${actor}:${base}`) ?? "null",
    );
    if (
      !item ||
      typeof item.url !== "string" ||
      !Number.isFinite(item.at) ||
      Date.now() - item.at > 600000 ||
      !Number.isFinite(item.scroll) ||
      item.scroll < 0
    )
      return;
    const url = new URL(item.url, location.origin);
    if (url.origin !== location.origin || url.pathname !== base) return;
    return { url: url.pathname + url.search, scroll: item.scroll };
  } catch {
    /* Storage is optional. */
  }
}
export function useDashboardReturn(base: string) {
  const { data: session } = useSession();
  return () => readReturn(base, session?.user.id)?.url ?? base;
}
export default function DashboardListMemory() {
  const pathname = usePathname(),
    params = useSearchParams(),
    { data: session } = useSession();
  const actor = session?.user.id,
    query = params.toString();
  useEffect(() => {
    if (!actor || !routes.includes(pathname)) return;
    function save(event: MouseEvent) {
      const anchor = (event.target as Element)?.closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (
        !anchor ||
        anchor.target === "_blank" ||
        new URL(anchor.href).pathname === pathname
      )
        return;
      try {
        sessionStorage.setItem(
          `magga_admin_return:${actor}:${pathname}`,
          JSON.stringify({
            url: pathname + location.search,
            scroll: scrollY,
            at: Date.now(),
          }),
        );
      } catch {
        /* Storage is optional. */
      }
    }
    document.addEventListener("click", save, true);
    const saved = readReturn(pathname, actor);
    let observer: MutationObserver | undefined,
      frame = 0;
    if (saved && saved.url === pathname + (query ? `?${query}` : "")) {
      const restore = () => {
        if (!document.querySelector("[data-admin-list-ready]")) return;
        observer?.disconnect();
        frame = requestAnimationFrame(() =>
          window.scrollTo({ top: saved.scroll, behavior: "instant" }),
        );
      };
      observer = new MutationObserver(restore);
      observer.observe(document.body, { childList: true, subtree: true });
      restore();
    }
    return () => {
      document.removeEventListener("click", save, true);
      observer?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [pathname, query, actor]);
  return null;
}
