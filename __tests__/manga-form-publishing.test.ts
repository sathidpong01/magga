import { afterEach, beforeEach, describe, expect, it, jest, mock } from "bun:test";
import type { ReactElement } from "react";
import { restoreGlobals, stubGlobal } from "./helpers/globals";

const mocks = { fetch: jest.fn(), effects: [] as Array<() => void | (() => void)>, cleanups: [] as Array<() => void> };
const originalReact = await import("react");
mock.module("react", () => ({
  ...originalReact,
  useState: (initial: unknown) => [typeof initial === "function" ? initial() : initial, jest.fn()],
  useEffect: (effect: () => void | (() => void)) => { mocks.effects.push(effect); },
  useRef: (current: unknown) => ({ current }),
  useCallback: (callback: unknown) => callback,
}));
mock.module("next/navigation", () => ({ useRouter: () => ({ back: jest.fn(), push: jest.fn(), refresh: jest.fn() }) }));
const originalDnd = await import("@dnd-kit/core");
mock.module("@dnd-kit/core", () => ({
  ...originalDnd,
  useSensor: jest.fn(), useSensors: jest.fn(),
}));
mock.module("@/lib/auth-fetch", () => ({ authFetch: mocks.fetch }));

const { default: MangaForm } = await import("@/app/components/forms/MangaForm");

type FormElement = ReactElement<{
  component?: string;
  type?: string;
  onSubmit?: (event: { preventDefault: () => void }) => Promise<void>;
  onClick?: (event: { preventDefault: () => void }) => void;
  children?: unknown;
}>;

function findElement(node: unknown, matches: (element: FormElement) => boolean): FormElement | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElement(child, matches);
      if (found) return found;
    }
  } else if (node && typeof node === "object" && "props" in node) {
    const element = node as FormElement;
    return matches(element) ? element : findElement(element.props.children, matches);
  }
}

function renderForm(isHidden: boolean) {
  const tree = MangaForm({
    mode: "admin",
    manga: {
      id: "manga-id", title: "Draft", slug: "draft", coverImage: "/cover.png",
      pages: ["/page-2.png", "/page-1.png"], tags: [], isHidden,
      description: null, coverWidth: null, coverHeight: null,
      authorName: null, extraMetadata: null, categoryId: null, authorId: null,
      createdAt: "2026-10-04T00:00:00Z", updatedAt: "2026-10-04T00:00:00Z",
      viewCount: 0, ratingSum: 0, ratingCount: 0, averageRating: 0, fts: null,
    },
  });
  for (const effect of mocks.effects.splice(0)) {
    const cleanup = effect();
    if (typeof cleanup === "function") mocks.cleanups.push(cleanup);
  }
  return tree;
}

describe("manga editor publishing", () => {
  beforeEach(() => {
    mocks.effects = [];
    mocks.cleanups = [];
    stubGlobal("fetch", async () => Response.json([]));
    mocks.fetch.mockReset();
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ id: "manga-id" }) });
  });
  afterEach(() => { mocks.cleanups.forEach((cleanup) => cleanup()); restoreGlobals(); });

  it.each([true, false])("preserves stored visibility on a normal update (hidden=%s)", async (isHidden) => {
    const tree = renderForm(isHidden);
    const form = findElement(tree, (element) => element.props.component === "form")!;
    await form.props.onSubmit!({ preventDefault: jest.fn() });
    const [endpoint, options] = mocks.fetch.mock.calls[0];
    expect(endpoint).toBe("/api/manga/manga-id");
    expect(options.method).toBe("PUT");
    const body = JSON.parse(options.body);
    expect(body).not.toHaveProperty("isHidden");
    expect(body.pages).toEqual(["/page-2.png", "/page-1.png"]);
  });

  it("provides an explicit publish action for a draft", async () => {
    const button = findElement(renderForm(true), (element) => element.props.children === "เผยแพร่มังงะ");
    expect(button).toBeDefined();
    await button!.props.onClick!({ preventDefault: jest.fn() });
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body).isHidden).toBe(false);
  });
  it("allows only one save request while its acknowledgement is pending", async () => {
    let acknowledge!: (response: { ok: boolean; json: () => Promise<{ id: string }> }) => void;
    mocks.fetch.mockImplementation(() => new Promise((resolve) => { acknowledge = resolve; }));
    const tree = renderForm(true);
    const form = findElement(tree, (element) => element.props.component === "form")!;
    const first = form.props.onSubmit!({ preventDefault: jest.fn() });
    await form.props.onSubmit!({ preventDefault: jest.fn() });
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    acknowledge({ ok: true, json: async () => ({ id: "manga-id" }) });
    await first;
  });
  it("does not replay a saved edit while its public cache refresh is pending", async () => {
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ id: "manga-id", cache_refresh_pending: true }) });
    const form = findElement(renderForm(true), (element) => element.props.component === "form")!;
    await form.props.onSubmit!({ preventDefault: jest.fn() });
    await form.props.onSubmit!({ preventDefault: jest.fn() });
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });
});
