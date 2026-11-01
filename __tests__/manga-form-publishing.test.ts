import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
  mock,
} from "bun:test";
import type { ReactElement } from "react";
import type { UploadFileStatus } from "@/app/components/ui/UploadProgress";
import { restoreGlobals, stubGlobal } from "./helpers/globals";

const mocks = {
  fetch: jest.fn(),
  effects: [] as Array<() => void | (() => void)>,
  cleanups: [] as Array<() => void>,
  state: [] as unknown[],
  refs: [] as Array<{ current: unknown }>,
  stateIndex: 0,
  refIndex: 0,
};
const originalReact = await import("react");
mock.module("react", () => ({
  ...originalReact,
  useState: (initial: unknown) => {
    const index = mocks.stateIndex++;
    if (!(index in mocks.state)) mocks.state[index] = typeof initial === "function" ? initial() : initial;
    return [mocks.state[index], (value: unknown) => {
      mocks.state[index] = typeof value === "function" ? value(mocks.state[index]) : value;
    }];
  },
  useEffect: (effect: () => void | (() => void)) => {
    mocks.effects.push(effect);
  },
  useRef: (current: unknown) => mocks.refs[mocks.refIndex++] ?? (mocks.refs[mocks.refIndex - 1] = { current }),
  useCallback: (callback: unknown) => callback,
}));
mock.module("next/navigation", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), refresh: jest.fn() }),
}));
const originalDnd = await import("@dnd-kit/core");
mock.module("@dnd-kit/core", () => ({
  ...originalDnd,
  useSensor: jest.fn(),
  useSensors: jest.fn(),
}));
mock.module("@/lib/auth-fetch", () => ({ authFetch: mocks.fetch }));

// These publishing tests deliberately exercise save semantics without a DOM/session store.
mock.module("@/app/components/dashboard/DashboardListMemory", () => ({
  useDashboardReturn: (base: string) => () => base,
}));
mock.module("@/app/components/dashboard/useUnsavedWork", () => ({
  useUnsavedWork: () => ({
    dirty: false,
    markDirty: jest.fn(),
    markSaved: jest.fn(),
    confirmLeave: () => true,
  }),
}));
const { default: MangaForm } = await import("@/app/components/forms/MangaForm");

type FormElement = ReactElement<{
  component?: string;
  open?: boolean;
  fullScreen?: boolean;
  "aria-labelledby"?: string;
  "aria-label"?: string;
  accept?: string;
  multiple?: boolean;
  files?: UploadFileStatus[];
  onRetry?: (id: string) => Promise<void>;
  type?: string;
  onChange?: (event: { target: { files: File[]; value: string } }) => void;
  onSubmit?: (event: { preventDefault: () => void }) => Promise<void>;
  onClick?: (event: { preventDefault: () => void }) => void;
  children?: unknown;
}>;

function findElement(
  node: unknown,
  matches: (element: FormElement) => boolean,
): FormElement | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElement(child, matches);
      if (found) return found;
    }
  } else if (node && typeof node === "object" && "props" in node) {
    const element = node as FormElement;
    return matches(element)
      ? element
      : findElement(element.props.children, matches);
  }
}

function renderForm(isHidden: boolean, scheduledPublishAt: string | null = null, rerender = false) {
  if (!rerender) { mocks.state = []; mocks.refs = []; }
  mocks.stateIndex = 0;
  mocks.refIndex = 0;
  const tree = MangaForm({
    mode: "admin",
    manga: {
      id: "manga-id",
      title: "Draft",
      slug: "draft",
      coverImage: "/cover.png",
      pages: ["/page-2.png", "/page-1.png"],
      tags: [],
      isHidden,
      scheduledPublishAt,
      publicationTimeZone: scheduledPublishAt ? "Asia/Bangkok" : null,
      description: null,
      coverWidth: null,
      coverHeight: null,
      authorName: null,
      extraMetadata: null,
      categoryId: null,
      authorId: null,
      createdAt: "2026-10-04T00:00:00Z",
      updatedAt: "2026-10-04T00:00:00Z",
      viewCount: 0,
      ratingSum: 0,
      ratingCount: 0,
      averageRating: 0,
      fts: null,
    },
  });
  for (const effect of mocks.effects.splice(0)) {
    const cleanup = effect();
    if (typeof cleanup === "function") mocks.cleanups.push(cleanup);
  }
  return tree;
}

function installUploads(failFirst = false) {
  const sent: FormData[] = [];
  class UploadRequest {
    upload = { onprogress: () => {} };
    status = 200;
    responseText = "";
    onload = () => {};
    open() {}
    setRequestHeader() {}
    send(body: FormData) {
      sent.push(body);
      const file = body.get("files");
      this.status = failFirst && sent.length === 1 ? 500 : 200;
      this.responseText = JSON.stringify({ urls: [`https://images.example/${file instanceof File ? file.name : "unknown"}`] });
      queueMicrotask(() => this.onload());
    }
    abort() {}
  }
  stubGlobal("XMLHttpRequest", UploadRequest);
  return sent;
}

describe("manga editor publishing", () => {
  beforeEach(() => {
    mocks.effects = [];
    mocks.cleanups = [];
    stubGlobal("fetch", async () => Response.json([]));
    mocks.fetch.mockReset();
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "manga-id" }),
    });
  });
  afterEach(() => {
    mocks.cleanups.forEach((cleanup) => cleanup());
    restoreGlobals();
  });
  it("opens scheduling only through a separate dialog action", async () => {
    for (const scheduledAt of [null, "2099-01-01T12:00:00Z"]) {
      const tree = renderForm(true, scheduledAt);
      const dialog = findElement(tree, element => element.props["aria-labelledby"] === "publication-dialog-title")!;
      expect(dialog.props.open).toBe(false);
      const form = findElement(tree, element => element.props.component === "form")!;
      expect(findElement(form, element => element.props["aria-labelledby"] === "publication-dialog-title")).toBeUndefined();
      expect(findElement(form, element => element.props.component === "details")).toBeUndefined();
      const action = findElement(form, element => element.props.children === (scheduledAt ? "จัดการเวลาเผยแพร่" : "ตั้งเวลาเผยแพร่"))!;
      await action.props.onClick!({ preventDefault: jest.fn() });
      expect(mocks.fetch).not.toHaveBeenCalled();
    }
  });

  it("previews cover selection without uploading and saves cover and pages through one queue", async () => {
    const sent = installUploads();
    const tree = renderForm(true);
    const coverInput = findElement(tree, element => element.props.type === "file" && !element.props.multiple)!;
    const pageInput = findElement(tree, element => element.props.type === "file" && Boolean(element.props.multiple))!;
    const coverEvent = { target: { files: [new File(["cover"], "new-cover.png", { type: "image/png" })], value: "cover" } };
    coverInput.props.onChange!(coverEvent);
    pageInput.props.onChange!({ target: { files: [new File(["page"], "new-page.png", { type: "image/png" })], value: "page" } });
    expect(coverEvent.target.value).toBe("");
    expect(sent).toHaveLength(0);
    expect(mocks.fetch).not.toHaveBeenCalled();

    const previewTree = renderForm(true, null, true);
    const preview = findElement(previewTree, element => element.props["aria-label"] === "ดูตัวอย่างรูปปก")!;
    preview.props.onClick!({ preventDefault: jest.fn() });
    expect(sent).toHaveLength(0);
    const openedPreview = findElement(renderForm(true, null, true), element => element.props.fullScreen === true)!;
    expect(openedPreview.props.open).toBe(true);
    const form = findElement(previewTree, element => element.props.component === "form")!;
    await form.props.onSubmit!({ preventDefault: jest.fn() });
    expect(sent).toHaveLength(2);
    const body = JSON.parse(mocks.fetch.mock.calls[0][1].body);
    expect(body.coverImage).toBe("https://images.example/new-cover.png");
    expect(body.pages).toEqual(["/page-2.png", "/page-1.png", "https://images.example/new-page.png"]);
    await form.props.onSubmit!({ preventDefault: jest.fn() });
    expect(sent).toHaveLength(2);
  });

  it("retries a failed cover from the shared progress panel before saving", async () => {
    const sent = installUploads(true);
    const tree = renderForm(true);
    const input = findElement(tree, element => element.props.type === "file" && !element.props.multiple)!;
    input.props.onChange!({ target: { files: [new File(["cover"], "retry-cover.png", { type: "image/png" })], value: "cover" } });
    const form = findElement(renderForm(true, null, true), element => element.props.component === "form")!;
    await form.props.onSubmit!({ preventDefault: jest.fn() });
    expect(mocks.fetch).not.toHaveBeenCalled();
    const progress = findElement(renderForm(true, null, true), element => Boolean(element.props.onRetry))!;
    const failed = progress.props.files!.find(file => file.status === "error")!;
    expect(failed.name).toBe("retry-cover.png");
    await progress.props.onRetry!(failed.id);
    expect(sent).toHaveLength(2);
    const updatedTree = renderForm(true, null, true);
    const updatedProgress = findElement(updatedTree, element => Boolean(element.props.onRetry))!;
    expect(updatedProgress.props.files![0].status).toBe("completed");
    await findElement(updatedTree, element => element.props.component === "form")!.props.onSubmit!({ preventDefault: jest.fn() });
    expect(sent).toHaveLength(2);
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body).coverImage).toBe("https://images.example/retry-cover.png");
  });

  it("shows invalid selections immediately and preserves the existing cover and pages", async () => {
    const sent = installUploads();
    const tree = renderForm(true);
    const cover = findElement(tree, element => element.props.type === "file" && !element.props.multiple)!;
    const pages = findElement(tree, element => element.props.type === "file" && Boolean(element.props.multiple))!;
    cover.props.onChange!({ target: { files: [new File(["bmp"], "invalid.bmp", { type: "image/bmp" })], value: "bmp" } });
    pages.props.onChange!({ target: { files: [new File([new Uint8Array(4 * 1024 * 1024 + 1)], "large.png", { type: "image/png" })], value: "large" } });
    const updated = renderForm(true, null, true);
    expect(findElement(updated, element => typeof element.props.children === "string" && element.props.children.includes("invalid.bmp"))).toBeDefined();
    expect(findElement(updated, element => typeof element.props.children === "string" && element.props.children.includes("large.png"))).toBeDefined();
    expect(sent).toHaveLength(0);
    await findElement(updated, element => element.props.component === "form")!.props.onSubmit!({ preventDefault: jest.fn() });
    const body = JSON.parse(mocks.fetch.mock.calls[0][1].body);
    expect(body.coverImage).toBe("/cover.png");
    expect(body.pages).toEqual(["/page-2.png", "/page-1.png"]);
  });

  it("uploads at most six files concurrently and saves pages in selection order", async () => {
    const requests: UploadRequest[] = [];
    let active = 0;
    let peak = 0;
    class UploadRequest {
      upload = {};
      status = 200;
      responseText = "";
      onload = () => {};
      open() {}
      setRequestHeader() {}
      send(body: FormData) {
        const file = body.get("files");
        this.responseText = JSON.stringify({ urls: [`https://images.example/${file instanceof File ? file.name : "unknown"}`] });
        requests.push(this);
        peak = Math.max(peak, ++active);
      }
      complete() { active--; this.onload(); }
      abort() {}
    }
    stubGlobal("XMLHttpRequest", UploadRequest);
    const tree = renderForm(true);
    const input = findElement(tree, element => element.props.type === "file" && Boolean(element.props.multiple))!;
    const files = Array.from({ length: 9 }, (_, index) => new File(["image"], `${index}.png`, { type: "image/png" }));
    input.props.onChange!({ target: { files, value: "pages" } });
    const form = findElement(renderForm(true, null, true), element => element.props.component === "form")!;
    const saving = form.props.onSubmit!({ preventDefault: jest.fn() });
    expect(requests).toHaveLength(6);
    expect(mocks.fetch).not.toHaveBeenCalled();
    // Complete the initial uploads backwards to exercise out-of-order responses.
    for (const request of requests.slice().reverse()) request.complete();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(requests).toHaveLength(9);
    for (const request of requests.slice(6)) request.complete();
    await saving;
    expect(peak).toBe(6);
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body).pages).toEqual([
      "/page-2.png", "/page-1.png", ...files.map(file => `https://images.example/${file.name}`),
    ]);
  });

  it.each([true, false])(
    "preserves stored visibility on a normal update (hidden=%s)",
    async (isHidden) => {
      const tree = renderForm(isHidden);
      const form = findElement(
        tree,
        (element) => element.props.component === "form",
      )!;
      await form.props.onSubmit!({ preventDefault: jest.fn() });
      const [endpoint, options] = mocks.fetch.mock.calls[0];
      expect(endpoint).toBe("/api/manga/manga-id");
      expect(options.method).toBe("PUT");
      const body = JSON.parse(options.body);
      expect(body).not.toHaveProperty("isHidden");
      expect(body.pages).toEqual(["/page-2.png", "/page-1.png"]);
    },
  );

  it("provides an explicit publish action for a draft", async () => {
    const button = findElement(
      renderForm(true),
      (element) => element.props.children === "เผยแพร่มังงะ",
    );
    expect(button).toBeDefined();
    await button!.props.onClick!({ preventDefault: jest.fn() });
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body).isHidden).toBe(false);
  });
  it("preserves a schedule on an ordinary content edit", async () => {
    const tree = renderForm(true, "2099-01-01T12:00:00Z");
    const form = findElement(tree, element => element.props.component === "form")!;
    await form.props.onSubmit!({ preventDefault: jest.fn() });
    const body = JSON.parse(mocks.fetch.mock.calls[0][1].body);
    expect(body).not.toHaveProperty("isHidden");
    expect(body).not.toHaveProperty("scheduledPublishAt");
  });
  it("offers explicit cancellation back to a draft", async () => {
    const button = findElement(renderForm(true, "2099-01-01T12:00:00Z"), element => element.props.children === "ยกเลิกเวลาและเก็บเป็นฉบับร่าง")!;
    await button.props.onClick!({ preventDefault: jest.fn() });
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body).isHidden).toBe(true);
  });
  it("does not save an empty scheduling request", async () => {
    const button = findElement(renderForm(true), element => element.props.children === "ยืนยันตั้งเวลาเผยแพร่")!;
    await button.props.onClick!({ preventDefault: jest.fn() });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it("allows only one save request while its acknowledgement is pending", async () => {
    let acknowledge!: (response: {
      ok: boolean;
      json: () => Promise<{ id: string }>;
    }) => void;
    mocks.fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          acknowledge = resolve;
        }),
    );
    const tree = renderForm(true);
    const form = findElement(
      tree,
      (element) => element.props.component === "form",
    )!;
    const first = form.props.onSubmit!({ preventDefault: jest.fn() });
    await form.props.onSubmit!({ preventDefault: jest.fn() });
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    acknowledge({ ok: true, json: async () => ({ id: "manga-id" }) });
    await first;
  });
  it("does not replay a saved edit while its public cache refresh is pending", async () => {
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "manga-id", cache_refresh_pending: true }),
    });
    const form = findElement(
      renderForm(true),
      (element) => element.props.component === "form",
    )!;
    await form.props.onSubmit!({ preventDefault: jest.fn() });
    await form.props.onSubmit!({ preventDefault: jest.fn() });
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });
});
