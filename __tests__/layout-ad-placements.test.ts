import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

const route = vi.hoisted(() => ({
  pathname: "/",
  params: {} as Record<string, string>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  useParams: () => route.params,
}));
vi.mock("@/app/components/layout/Header", () => ({ default: () => null }));
vi.mock("@/app/components/layout/Footer", () => ({
  default: () => createElement("footer", { "data-testid": "site-footer" }),
}));
vi.mock("@/app/components/features/ads", () => ({
  AdContainer: ({ placement }: { placement: string }) => createElement("aside", { "data-placement": placement }),
}));

import LayoutWrapper from "@/app/components/layout/LayoutWrapper";

describe("layout advertisement placements", () => {
  it("omits the footer ad on manga pages without removing the manga-end ad or site footer", () => {
    route.pathname = "/passing-love-1";
    route.params = { mangaId: "passing-love-1" };
    const html = renderToStaticMarkup(
      LayoutWrapper({ children: createElement("aside", { "data-placement": "manga-end" }) }),
    );
    expect(html).not.toContain('data-placement="footer"');
    expect(html).toContain('data-placement="manga-end"');
    expect(html).toContain('data-placement="header"');
    expect(html).toContain('data-testid="site-footer"');
  });

  it.each([
    ["/", {}],
    ["/changelog", {}],
    ["/category/MM", { categoryName: "MM" }],
    ["/tag/bear", { tagName: "bear" }],
    ["/profile/reader", { username: "reader" }],
  ])("keeps footer ads on %s", (pathname, params) => {
    route.pathname = pathname;
    route.params = params as Record<string, string>;
    const html = renderToStaticMarkup(LayoutWrapper({ children: createElement("div") }));
    expect(html).toContain('data-placement="footer"');
  });

  it("keeps standalone dashboard pages free of layout ads", () => {
    route.pathname = "/dashboard/admin/manga/123/edit";
    route.params = { id: "123" };
    const html = renderToStaticMarkup(LayoutWrapper({ children: createElement("div", null, "editor") }));
    expect(html).not.toContain("data-placement");
    expect(html).toContain("editor");
  });
});
