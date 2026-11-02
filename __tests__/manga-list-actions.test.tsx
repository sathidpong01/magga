import { beforeEach, expect, it, mock } from "bun:test";
import { isValidElement, type ReactElement } from "react";

const state: unknown[] = [];
const refs: { current: unknown }[] = [];
let stateIndex = 0,
  refIndex = 0;
const fetchMock = mock<
  (url: string, options?: RequestInit) => Promise<unknown>
>(async () => ({ ok: true, json: async () => ({ ids: [] }) }));
const refresh = mock(() => {}),
  showError = mock(() => {});
const react = await import("react");
mock.module("react", () => ({
  ...react,
  useState: (initial: unknown) => {
    const index = stateIndex++;
    if (!(index in state)) state[index] = initial;
    return [
      state[index],
      (value: unknown) => {
        state[index] =
          typeof value === "function" ? value(state[index]) : value;
      },
    ];
  },
  useRef: (initial: unknown) =>
    refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }),
  useEffect: () => {},
}));
mock.module("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
mock.module("@/lib/auth-fetch", () => ({ authFetch: fetchMock }));
mock.module("@/app/contexts/ToastContext", () => ({
  useToast: () => ({ showSuccess: () => {}, showError }),
}));
const { default: MangaDataTable } =
  await import("@/app/dashboard/admin/manga/MangaDataTable");
const works = [1, 2].map((index) => ({
  id: `work-${index}`,
  title: `Work ${index}`,
  slug: null,
  coverImage: "",
  isHidden: false,
  viewCount: 0,
  category: null,
  tags: [],
  author: null,
}));
type Element = ReactElement<Record<string, unknown>>;
function find(
  node: unknown,
  predicate: (element: Element) => boolean,
): Element {
  if (Array.isArray(node)) {
    for (const item of node) {
      const result = search(item, predicate);
      if (result) return result;
    }
  } else {
    const result = search(node, predicate);
    if (result) return result;
  }
  throw new Error("Expected control missing");
}
function search(
  node: unknown,
  predicate: (element: Element) => boolean,
): Element | undefined {
  if (!isValidElement<Record<string, unknown>>(node)) return;
  if (predicate(node)) return node;
  const children = node.props.children;
  for (const child of Array.isArray(children) ? children : [children]) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const result = search(item, predicate);
        if (result) return result;
      }
    } else {
      const result = search(child, predicate);
      if (result) return result;
    }
  }
}
function render(initialMangas = works) {
  stateIndex = 0;
  refIndex = 0;
  return MangaDataTable({ initialMangas });
}
function click(node: unknown, label: string) {
  const control = find(
    node,
    (element) =>
      element.props.children === label &&
      typeof element.props.onClick === "function",
  );
  (control.props.onClick as () => void)();
}
function compact(node: unknown) {
  return find(
    node,
    (element) => typeof element.props.onVisibility === "function",
  );
}
function selectTwo() {
  click(render(), "เลือกรายการ");
  const select = compact(render()).props.onSelect as (id: string) => void;
  select(works[0].id);
  select(works[1].id);
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
beforeEach(() => {
  state.length = 0;
  refs.length = 0;
  fetchMock.mockClear();
  refresh.mockClear();
  showError.mockClear();
});

it("reviews bulk deletion before any request and cancelling retains the selection", () => {
  selectTwo();
  click(render(), "ลบที่เลือก");
  const dialog = find(
    render(),
    (element) => element.props["aria-labelledby"] === "bulk-confirm-title",
  );
  expect(dialog.props.open).toBe(true);
  expect(fetchMock).not.toHaveBeenCalled();
  click(dialog, "ยกเลิก");
  expect(compact(render()).props.selected).toEqual(["work-1", "work-2"]);
  expect(fetchMock).not.toHaveBeenCalled();
});

it("allows one deletion request while pending and removes only acknowledged IDs", async () => {
  let resolveRequest!: (value: unknown) => void;
  fetchMock.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
  );
  selectTwo();
  click(render(), "ลบที่เลือก");
  const dialog = find(
    render(),
    (element) => element.props["aria-labelledby"] === "bulk-confirm-title",
  );
  click(dialog, "ยืนยันการลบ");
  click(dialog, "ยืนยันการลบ");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(compact(render()).props.busy).toBe(true);
  resolveRequest({ ok: true, json: async () => ({ ids: ["work-1"] }) });
  await settle();
  expect(compact(render()).props.mangas).toEqual([works[1]]);
  expect(compact(render()).props.selected).toEqual(["work-2"]);
  expect(refresh).toHaveBeenCalledTimes(1);
});

it("retains items and selected IDs on a failed bulk request so it can be retried", async () => {
  fetchMock.mockResolvedValueOnce({ ok: false });
  selectTwo();
  click(render(), "ซ่อนที่เลือก");
  await settle();
  expect(compact(render()).props.mangas).toEqual(works);
  expect(compact(render()).props.selected).toEqual(["work-1", "work-2"]);
  expect(compact(render()).props.busy).toBe(false);
  expect(showError).toHaveBeenCalled();
});

it("does not publish scheduled work until its immediate-publication warning is confirmed", async () => {
  const scheduled = {
    ...works[0],
    isHidden: true,
    scheduledPublishAt: "2026-12-03T12:00:00Z",
  };
  const tree = render([scheduled]);
  (compact(tree).props.onVisibility as (work: typeof scheduled) => void)(
    scheduled,
  );
  const dialog = find(
    render([scheduled]),
    (element) => element.props["aria-labelledby"] === "publish-now-title",
  );
  expect(dialog.props.open).toBe(true);
  expect(fetchMock).not.toHaveBeenCalled();
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ isHidden: false }),
  });
  click(dialog, "เผยแพร่ทันที");
  await settle();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).toEqual({
    isHidden: false,
  });
});
