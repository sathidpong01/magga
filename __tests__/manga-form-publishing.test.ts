import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useState: (initial: unknown) => [typeof initial === "function" ? initial() : initial, vi.fn()],
  useEffect: vi.fn(),
  useRef: (current: unknown) => ({ current }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@dnd-kit/core", async (importOriginal) => ({
  ...await importOriginal<typeof import("@dnd-kit/core")>(),
  useSensor: vi.fn(), useSensors: vi.fn(),
}));
vi.mock("@/lib/auth-fetch", () => ({ authFetch: mocks.fetch }));

import MangaForm from "@/app/components/forms/MangaForm";

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
  return MangaForm({
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
}

describe("manga editor publishing", () => {
  beforeEach(() => {
    mocks.fetch.mockReset();
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ id: "manga-id" }) });
  });

  it.each([true, false])("preserves stored visibility on a normal update (hidden=%s)", async (isHidden) => {
    const tree = renderForm(isHidden);
    const form = findElement(tree, (element) => element.props.component === "form")!;
    await form.props.onSubmit!({ preventDefault: vi.fn() });
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
    await button!.props.onClick!({ preventDefault: vi.fn() });
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body).isHidden).toBe(false);
  });
});
