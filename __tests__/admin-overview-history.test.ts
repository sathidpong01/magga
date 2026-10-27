import { expect, it, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { parse } from "node-html-parser";
import { Children, isValidElement, type ReactNode } from "react";

const works = Array.from({ length: 10 }, (_, index) => ({
  id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  title: `Work ${index + 1}`, slug: `work-${index + 1}`,
  viewCount: 100 - index, coverImage: null,
}));
const summaries = mock(async () => Object.fromEntries(works.map(work => [work.id, {
  startedAt: "2026-10-27T00:00:00Z", baselineViews: work.viewCount,
  points: [{ date: "2026-10-27", views: 0 }],
}])));
mock.module("@/lib/auth-helpers", () => ({ requireAdminPage: async () => {}, isAdminRole: () => true }));
mock.module("@/lib/auth", () => ({ auth: { api: { getSession: async () => ({ user: { role: "admin" } }) } } }));
mock.module("next/headers", () => ({ headers: async () => new Headers() }));
mock.module("@/lib/admin-overview", () => ({
  readAdminOverview: async () => ({ manga: 10, categories: 1, tags: 1, drafts: 0, users: 1, comments: 0, pending: 0, reports: 0, proposals: 0 }),
  boundedAdminCount: String,
}));
mock.module("@/lib/admin-view-history", () => ({ readViewSummaries: summaries }));
mock.module("@/db", () => ({ db: { select: () => ({ from: () => ({ where: () => ({ orderBy: () => ({ limit: async () => works }) }) }) }) } }));
const { default: AdminPage } = await import("@/app/dashboard/admin/(overview)/page");

it("shows history for all ten ranked works without nesting controls in manga links", async () => {
  const root = parse(renderToStaticMarkup(await AdminPage()));
  const buttons = root.querySelectorAll("button[aria-label]").filter(button => button.getAttribute("aria-label")?.startsWith("ดูสถิติยอดอ่าน "));
  expect(summaries).toHaveBeenCalledTimes(1);
  expect(summaries).toHaveBeenCalledWith(works.map(work => work.id));
  expect(buttons).toHaveLength(10);
  expect(root.querySelectorAll('svg[aria-label="แนวโน้มยอดอ่าน 7 วัน"]')).toHaveLength(10);
  for (const [index, button] of buttons.entries()) {
    expect(button.getAttribute("aria-label")).toBe(`ดูสถิติยอดอ่าน Work ${index + 1}`);
    expect(button.closest("a")).toBeNull();
    expect(root.querySelector(`a[href="/work-${index + 1}"]`)).not.toBeNull();
  }
});

it("keeps component props serializable across the overview's server/client boundary", async () => {
  function check(node: ReactNode) {
    if (!isValidElement<{ component?: unknown; children?: ReactNode }>(node)) return;
    if (node.props.component !== undefined) expect(typeof node.props.component).toBe("string");
    Children.forEach(node.props.children, check);
  }
  check(await AdminPage());
});
