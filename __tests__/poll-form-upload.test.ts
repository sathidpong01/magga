import { afterEach, beforeEach, expect, it, jest, mock } from "bun:test";
import type { ReactElement } from "react";
import type { AdminPoll } from "@/lib/polls/types";
import { restoreGlobals, stubGlobal } from "./helpers/globals";

const hooks = {
  states: [] as unknown[],
  refs: [] as { current: unknown }[],
  effects: [] as (() => void | (() => void))[],
  cleanups: [] as (() => void)[],
  state: 0,
  ref: 0,
};
const realReact = await import("react");
mock.module("react", () => ({
  ...realReact,
  useState: (initial: unknown) => {
    const i = hooks.state++;
    if (!(i in hooks.states))
      hooks.states[i] = typeof initial === "function" ? initial() : initial;
    return [
      hooks.states[i],
      (value: unknown) => {
        hooks.states[i] =
          typeof value === "function" ? value(hooks.states[i]) : value;
      },
    ];
  },
  useRef: (initial: unknown) =>
    hooks.refs[hooks.ref++] ??
    (hooks.refs[hooks.ref - 1] = { current: initial }),
  useEffect: (effect: () => void | (() => void)) => {
    hooks.effects.push(effect);
  },
}));
const request =
  jest.fn<(url: string, options?: RequestInit) => Promise<Response>>();
const showError = jest.fn();
mock.module("@/lib/auth-fetch", () => ({ authFetch: request }));
mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));
mock.module("@/app/contexts/ToastContext", () => ({
  useToast: () => ({ showError }),
}));
const { default: PollForm } =
  await import("@/app/components/features/polls/PollForm");

type Element = ReactElement<{
  component?: string;
  type?: string;
  label?: string;
  src?: string;
  disabled?: boolean;
  children?: unknown;
  onChange?: (event: { target: { files?: File[]; value: string } }) => void;
  onSubmit?: (event: { preventDefault: () => void }) => void;
}>;
function find(node: unknown, match: (element: Element) => boolean): Element[] {
  if (Array.isArray(node)) return node.flatMap((item) => find(item, match));
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as Element;
  return [
    ...(match(element) ? [element] : []),
    ...find(element.props.children, match),
  ];
}
let initial: AdminPoll;
function render() {
  hooks.state = 0;
  hooks.ref = 0;
  const tree = PollForm({
    initial,
    onSaved: (poll) => {
      initial = poll;
    },
  });
  for (const effect of hooks.effects.splice(0)) {
    const cleanup = effect();
    if (cleanup) hooks.cleanups.push(cleanup);
  }
  return tree;
}
const file = (name: string) => new File([name], name, { type: "image/png" });
function select(index: number, name: string) {
  const tree = render();
  find(tree, (e) => e.props.type === "file")[index].props.onChange!({
    target: { files: [file(name)], value: name },
  });
}
async function save() {
  find(render(), (e) => e.props.component === "form")[0].props.onSubmit!({
    preventDefault: () => {},
  });
  await Bun.sleep(30);
}

beforeEach(() => {
  hooks.states = [];
  hooks.refs = [];
  hooks.effects = [];
  hooks.cleanups = [];
  request.mockReset();
  showError.mockReset();
  stubGlobal("window", {
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  initial = {
    id: crypto.randomUUID(),
    title: "คำถาม",
    description: "",
    coverAssetId: null,
    visibility: "public",
    resultsVisibility: "after_vote",
    security: "standard",
    requireCaptcha: true,
    minChoices: 1,
    maxChoices: 1,
    allowChange: false,
    showCount: true,
    showOnHome: true,
    pinned: false,
    startsAt: new Date(Date.now() - 60000).toISOString(),
    endsAt: new Date(Date.now() + 86400000).toISOString(),
    options: ["หนึ่ง", "สอง"].map((label) => ({
      id: crypto.randomUUID(),
      label,
      assetId: null,
      mangaId: null,
      imageUrl: null,
      width: null,
      height: null,
    })),
    state: "draft",
    status: "draft",
    version: 1,
    createdAt: new Date().toISOString(),
    serverNow: new Date().toISOString(),
    coverImageUrl: null,
    total: 0,
    excluded: 0,
    resultsAllowed: true,
    hasVoted: false,
    selections: [],
  };
  request.mockImplementation(async (url, options) => {
    if (url.endsWith("/upload"))
      return Response.json({
        id: crypto.randomUUID(),
        url: "/saved-image.webp",
      });
    const { input } = JSON.parse(String(options?.body));
    return Response.json({
      ...initial,
      ...input,
      version: initial.version + 1,
      coverImageUrl: input.coverAssetId ? "/saved-image.webp" : null,
      options: input.options.map((option: AdminPoll["options"][number]) => ({
        ...option,
        imageUrl: option.assetId ? "/saved-image.webp" : null,
        width: null,
        height: null,
      })),
    });
  });
});
afterEach(() => {
  hooks.cleanups.forEach((cleanup) => cleanup());
  restoreGlobals();
});

it("keeps replacement images local and pauses autosave until the user explicitly saves", async () => {
  select(0, "discarded.png");
  select(0, "cover.png");
  select(1, "answer.png");
  render();
  expect(request).not.toHaveBeenCalled();
  expect(
    find(render(), (e) => e.props.src?.startsWith("blob:") === true).length,
  ).toBeGreaterThan(0);
  await Bun.sleep(1950);
  expect(request).not.toHaveBeenCalled();
});

it("uploads only on explicit save, then sends asset IDs and releases local previews", async () => {
  select(0, "discarded.png");
  select(0, "cover.png");
  select(1, "answer.png");
  await save();
  const uploads = request.mock.calls.filter(([url]) => url.endsWith("/upload"));
  expect(
    uploads.map(([, options]) => (options?.body as FormData).get("file")),
  ).toEqual([file("cover.png"), file("answer.png")]);
  const pollRequest = request.mock.calls.find(
    ([url]) => !url.endsWith("/upload"),
  )!;
  const { input } = JSON.parse(String(pollRequest[1]?.body));
  expect(input.coverAssetId).toBeTruthy();
  expect(input.options[0].assetId).toBeTruthy();
  expect(JSON.stringify(input)).not.toContain("blob:");
  expect(
    find(render(), (e) => e.props.src?.startsWith("blob:") === true),
  ).toHaveLength(0);
});

it("retains previews after a failed poll save and retries without uploading the same files again", async () => {
  const normal = request.getMockImplementation()!;
  let failed = false;
  request.mockImplementation(async (url, options) => {
    if (!url.endsWith("/upload") && !failed) {
      failed = true;
      return Response.json({ error: "บันทึกไม่สำเร็จ" }, { status: 503 });
    }
    return normal(url, options);
  });
  select(0, "cover.png");
  await save();
  expect(
    find(render(), (e) => e.props.src?.startsWith("blob:") === true).length,
  ).toBeGreaterThan(0);
  await save();
  expect(
    request.mock.calls.filter(([url]) => url.endsWith("/upload")),
  ).toHaveLength(1);
  expect(
    request.mock.calls.filter(([url]) => !url.endsWith("/upload")),
  ).toHaveLength(2);
});

it("validates the poll before starting any file uploads", async () => {
  select(0, "cover.png");
  find(render(), (e) => e.props.label === "ชื่อโพล")[0].props.onChange!({
    target: { value: "" },
  });
  await save();
  expect(request).not.toHaveBeenCalled();
});

it("continues autosaving text edits when there are no local image changes", async () => {
  find(render(), (e) => e.props.label === "ชื่อโพล")[0].props.onChange!({
    target: { value: "คำถามใหม่" },
  });
  render();
  await Bun.sleep(1950);
  expect(
    request.mock.calls.filter(([url]) => url.endsWith("/upload")),
  ).toHaveLength(0);
  expect(
    request.mock.calls.filter(([url]) => !url.endsWith("/upload")),
  ).toHaveLength(1);
  expect(initial.title).toBe("คำถามใหม่");
});

it("keeps the editor usable and preserves a file selected while a text autosave is in flight", async () => {
  const normal = request.getMockImplementation()!;
  let finish!: () => void;
  const gate = new Promise<void>((resolve) => {
    finish = resolve;
  });
  request.mockImplementation(async (url, options) => {
    if (!url.endsWith("/upload")) await gate;
    return normal(url, options);
  });
  find(render(), (e) => e.props.label === "ชื่อโพล")[0].props.onChange!({
    target: { value: "คำถามใหม่" },
  });
  render();
  await Bun.sleep(1950);
  try {
    expect(request).toHaveBeenCalledTimes(1);
    expect(
      find(render(), (e) => e.props.component === "fieldset")[0].props.disabled,
    ).toBe(false);
    select(0, "while-saving.png");
  } finally {
    finish();
  }
  await Bun.sleep(30);
  expect(
    find(render(), (e) => e.props.src?.startsWith("blob:") === true).length,
  ).toBeGreaterThan(0);
  expect(
    request.mock.calls.filter(([url]) => url.endsWith("/upload")),
  ).toHaveLength(0);
});
