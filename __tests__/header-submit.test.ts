import { describe, expect, it, mock } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parse } from "node-html-parser";
import { isAdminRole, isUserBanned, type SessionLike } from "@/lib/auth-client";

const state = { pathname: "/", session: null as SessionLike, pending: false };
mock.module("next/navigation", () => ({
  usePathname: () => state.pathname,
  useRouter: () => ({ refresh() {} }),
}));
mock.module("@/lib/auth-client", () => ({
  useSession: () => ({ data: state.session, isPending: state.pending }),
  isAdminRole,
  isUserBanned,
  signOutAndSync: async () => {},
}));
mock.module("@/app/contexts/ToastContext", () => ({
  useToast: () => ({ showError() {}, showSuccess() {} }),
}));
mock.module("next/dynamic", () => ({ default: () => () => null }));
const { default: Header } = await import("@/app/components/layout/Header");

function renderSubmit(pathname: string, session: SessionLike = null, pending = false) {
  Object.assign(state, { pathname: new URL(pathname, "https://magga.test").pathname, session, pending });
  const root = parse(renderToStaticMarkup(createElement(Header)));
  const button = root.querySelectorAll("a").find(link => link.getAttribute("href")?.includes("submit"))!;
  const className = button.classNames.split(" ").find(name => name.startsWith("css-"))!;
  const css = root.querySelectorAll("style").map(style => style.textContent).join("");
  const compactRule = css.match(new RegExp(`@media \\(min-width:0px\\)\\{\\.${className}\\{([^}]+)`))![1];
  const desktopRule = css.match(new RegExp(`@media \\(min-width:1200px\\)\\{\\.${className}\\{([^}]+)`))![1];
  return { button, css, compactRule, desktopRule };
}

describe("header submission navigation", () => {
  it.each(["/", "/?author=Beep", "/?category=MM", "/?tags=Furry", "/tag/Furry", "/tag/Group", "/category/MM"])(
    "shows a direct submit action for guests and members on %s at mobile and tablet widths",
    pathname => {
      for (const session of [null, { user: { id: "reader", role: "user", name: "Reader" } }]) {
        const { button, compactRule } = renderSubmit(pathname, session);
        expect(compactRule).toContain("display:inline-flex");
        expect(button.parentNode?.classNames).toContain("MuiToolbar-root");
        expect(button.getAttribute("href")).toBe(session ? "/dashboard/submit" : "/auth/signin?callbackUrl=%2Fdashboard%2Fsubmit");
      }
    },
  );

  it.each(["/passing-love-1", "/profile/reader", "/settings", "/changelog", "/dashboard/submit"])(
    "hides the compact action outside catalog pages: %s",
    pathname => {
      const { compactRule, desktopRule } = renderSubmit(pathname, { user: { id: "reader", role: "user" } });
      expect(compactRule).toContain("display:none");
      expect(desktopRule).toContain("display:inline-flex");
    },
  );

  it("reserves the catalog action during session loading and preserves the admin exclusion", () => {
    expect(renderSubmit("/", null, true).compactRule).toContain("display:inline-flex");
    expect(renderSubmit("/", { user: { id: "admin", role: "admin" } }).css).toContain("visibility:hidden");
  });
});
