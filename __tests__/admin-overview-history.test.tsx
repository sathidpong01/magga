import { expect, it, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { parse } from "node-html-parser";
import { Children, isValidElement, type ReactNode } from "react";
import MangaViewHistory from "@/app/components/dashboard/MangaViewHistory";

const works = Array.from({ length: 10 }, (_, index) => ({
  id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  title: `Work ${index + 1}`, slug: `work-${index + 1}`,
  viewCount: 100 - index, coverImage: null,
}));
const summaries = mock(async () => Object.fromEntries(works.map((work, index) => [work.id, {
  startedAt: "2026-10-27T00:00:00Z", baselineViews: work.viewCount,
  points: Array.from({ length: 7 }, (_, day) => ({ date: `2026-10-${21 + day}`, views: day < 5 ? null : day === 5 ? 0 : index + 1 })),
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
  const buttons = root.querySelectorAll('button[aria-haspopup="dialog"]');
  expect(summaries).toHaveBeenCalledTimes(1);
  expect(summaries).toHaveBeenCalledWith(works.map(work => work.id));
  expect(buttons).toHaveLength(10);
  expect(buttons.filter(button => button.querySelector('svg[aria-hidden="true"]'))).toHaveLength(10);
  expect(root.textContent).not.toContain("ผู้ชม");
  const firstChart = buttons[0].querySelectorAll("svg")[0];
  expect(firstChart.querySelectorAll("title")).toHaveLength(7);
  expect(firstChart.querySelectorAll("rect")).toHaveLength(0);
  expect(firstChart.querySelectorAll('path[fill="none"]')[0].getAttribute("d")).toContain(" C");
  expect(firstChart.querySelectorAll("circle")).toHaveLength(2);
  expect(firstChart.textContent).toContain("ยังไม่มีข้อมูล");
  expect(root.textContent).toContain("7 วัน · 1 ครั้ง");
  for (const [index, button] of buttons.entries()) {
    const ids = button.getAttribute("aria-labelledby")?.split(" ") ?? [];
    expect(ids).toHaveLength(2);
    const labels = ids.map(id => root.querySelectorAll("[id]").find(element => element.id === id)?.textContent);
    expect(labels).toEqual([`7 วัน · ${index + 1} ครั้ง`, `ดูสถิติยอดอ่าน Work ${index + 1}`]);
    expect(button.querySelectorAll("[id]").some(element => element.id === ids[1])).toBe(false);
    expect(button.getAttribute("aria-label")).toBeUndefined();
    expect(button.closest("a")).toBeNull();
    expect(root.querySelector(`a[href="/work-${index + 1}"]`)).not.toBeNull();
  }
});

it("includes the visible fallback text in the history button's accessible name", () => {
  const root = parse(renderToStaticMarkup(<MangaViewHistory id={works[0].id} title="No history" />));
  const button = root.querySelectorAll("button")[0];
  const visibleId = button.getAttribute("aria-labelledby")?.split(" ")[0];
  expect(root.querySelectorAll("[id]").find(element => element.id === visibleId)?.textContent).toBe("ยังไม่เริ่มเก็บ · ดูสถิติ");
});

it("keeps component props serializable across the overview's server/client boundary", async () => {
  function check(node: ReactNode) {
    if (!isValidElement<{ component?: unknown; children?: ReactNode }>(node)) return;
    if (node.props.component !== undefined) expect(typeof node.props.component).toBe("string");
    Children.forEach(node.props.children, check);
  }
  check(await AdminPage());
});

it("curves recorded days without bridging unknown days or dropping recorded zeroes", () => {
  const initial = {
    startedAt: "2026-10-21T00:00:00Z", baselineViews: 0,
    points: [4, 0, null, 7, 2, 5, null].map((views, day) => ({ date: `2026-10-${21 + day}`, views })),
  };
  const root = parse(renderToStaticMarkup(<MangaViewHistory id={works[0].id} title="Gaps" initial={initial} />));
  const paths = root.querySelectorAll('path[fill="none"]');
  expect(paths).toHaveLength(2);
  expect(paths.every(path => path.getAttribute("d")?.includes(" C"))).toBe(true);
  expect(root.querySelectorAll("circle")).toHaveLength(5);
  expect(root.textContent).toContain("0 ครั้ง");
  expect(root.textContent).toContain("ยังไม่มีข้อมูล");
});
