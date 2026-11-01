import { afterEach, beforeEach, expect, it, jest, mock } from "bun:test";
import { restoreGlobals, stubGlobal } from "./helpers/globals";

const effects: Array<() => void | (() => void)> = [];
const originalReact = await import("react");
mock.module("react", () => ({
  ...originalReact,
  useSyncExternalStore: (_subscribe: unknown, snapshot: () => boolean) => snapshot(),
  useState: (value: unknown) => [value, () => {}],
  useRef: (current: unknown) => ({ current }),
  useEffect: (effect: () => void | (() => void)) => { effects.push(effect); },
}));
const { default: MangaViewRating } = await import("@/app/components/features/manga/MangaViewRating");
const fetcher = mock<(url: string, init?: RequestInit) => Promise<Response>>();
let cleanup: void | (() => void);
const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };

function mount() {
  MangaViewRating({ mangaId: "11111111-1111-4111-8111-111111111111", initialViewCount: 0,
    initialAverageRating: 0, initialRatingCount: 0, hideInteractive: true, trackViewOnMount: true });
  cleanup = effects[1]();
}

beforeEach(() => {
  effects.length = 0;
  cleanup = undefined;
  jest.useFakeTimers();
  stubGlobal("fetch", fetcher.mockReset().mockResolvedValue(new Response("{}")));
  stubGlobal("window", new EventTarget());
  stubGlobal("document", Object.assign(new EventTarget(), { cookie: `magga_consent=2.yes.${Date.now()}`, visibilityState: "visible" }));
});
afterEach(() => { cleanup?.(); jest.useRealTimers(); restoreGlobals(); });

it("retries a server failure and stops after acknowledgement", async () => {
  fetcher.mockResolvedValueOnce(new Response(null, { status: 503 }));
  mount();
  await flush();
  jest.advanceTimersByTime(500);
  await flush();
  expect(fetcher).toHaveBeenCalledTimes(2);
  document.dispatchEvent(new Event("visibilitychange"));
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it("retries a lost response with the same event ID and honors Retry-After", async () => {
  fetcher.mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce(new Response(null, { status: 429, headers: { "Retry-After": "2" } }));
  mount();
  await flush();
  jest.advanceTimersByTime(500);
  await flush();
  jest.advanceTimersByTime(1999);
  expect(fetcher).toHaveBeenCalledTimes(2);
  jest.advanceTimersByTime(1);
  await flush();
  expect(fetcher).toHaveBeenCalledTimes(3);
  const bodies = fetcher.mock.calls.map(([, init]) => init?.body);
  expect(new Set(bodies).size).toBe(1);
  expect(JSON.parse(String(bodies[0]))).toEqual({ eventId: expect.any(String) });
});

it("bounds failures to three attempts even after more visibility changes", async () => {
  fetcher.mockResolvedValue(new Response(null, { status: 500 }));
  mount();
  await flush();
  jest.advanceTimersByTime(500);
  await flush();
  jest.advanceTimersByTime(1000);
  await flush();
  document.dispatchEvent(new Event("visibilitychange"));
  jest.advanceTimersByTime(20_000);
  await flush();
  expect(fetcher).toHaveBeenCalledTimes(3);
});

it.each([400, 403, 404, 204, 429])("does not retry terminal HTTP %s or a long rate limit", async status => {
  fetcher.mockResolvedValue(new Response(null, { status, headers: { "Retry-After": "600" } }));
  mount();
  await flush();
  jest.advanceTimersByTime(20_000);
  await flush();
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it("waits for a visible tab and does not send without consent", () => {
  Object.assign(document, { visibilityState: "hidden" });
  mount();
  expect(fetcher).not.toHaveBeenCalled();
  document.dispatchEvent(new Event("visibilitychange"));
  expect(fetcher).not.toHaveBeenCalled();
  Object.assign(document, { visibilityState: "visible" });
  document.cookie = "";
  document.dispatchEvent(new Event("visibilitychange"));
  expect(fetcher).not.toHaveBeenCalled();
  document.cookie = `magga_consent=2.yes.${Date.now()}`;
  document.dispatchEvent(new Event("visibilitychange"));
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it.each(["unmount", "withdrawal"])("stops retries after %s", async reason => {
  fetcher.mockResolvedValue(new Response(null, { status: 503 }));
  mount();
  await flush();
  if (reason === "unmount") cleanup?.();
  else document.cookie = "";
  jest.advanceTimersByTime(500);
  await flush();
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it("keeps one delivery across React effect cleanup and replay", async () => {
  fetcher.mockResolvedValueOnce(new Response(null, { status: 503 }));
  mount();
  cleanup?.();
  cleanup = effects[1]();
  await flush();
  expect(fetcher).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(500);
  await flush();
  expect(fetcher).toHaveBeenCalledTimes(2);
});
