import { beforeEach, afterEach, describe, expect, it, jest, mock } from "bun:test";
import { stubGlobal, restoreGlobals } from "./helpers/globals";

const fetchMock = jest.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Partial<Response>>>();
const mocks = { effects: [] as Array<() => void | (() => void)>, setState: jest.fn(), pathname: "/" };
const originalReact = await import("react");
mock.module("react", () => ({
  ...originalReact,
  useState: (value: unknown) => [value, mocks.setState],
  useRef: (current: unknown) => ({ current }),
  useEffect: (effect: () => void | (() => void)) => { mocks.effects.push(effect); },
}));
mock.module("next/navigation", () => ({ usePathname: () => mocks.pathname }));
const { AdsProvider } = await import("@/app/components/features/ads/AdsProvider");

describe("advertisement request freshness", () => {
  beforeEach(() => {
    mocks.effects = [];
    mocks.setState.mockClear();
    jest.useFakeTimers();
    jest.setSystemTime(100000);
    stubGlobal("window", new EventTarget());
    stubGlobal("document", { visibilityState: "visible" });
    stubGlobal("fetch", fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => [] }));
  });
  afterEach(() => { jest.useRealTimers(); restoreGlobals(); });

  it("uses server data without an extra initial request", () => {
    AdsProvider({ children: null, initialAds: [] });
    const cleanup = mocks.effects[0]();
    mocks.effects[1]();
    window.dispatchEvent(new Event("focus"));
    expect(fetch).not.toHaveBeenCalled();
    if (typeof cleanup === "function") cleanup();
  });
  it("deduplicates mount, navigation and focus requests while pending", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    AdsProvider({ children: null });
    const cleanup = mocks.effects[0]();
    mocks.effects[1]();
    window.dispatchEvent(new Event("focus"));
    expect(fetch).toHaveBeenCalledTimes(1);
    if (typeof cleanup === "function") cleanup();
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });
  it("refreshes on focus when the snapshot is stale", () => {
    AdsProvider({ children: null, initialAds: [] });
    const cleanup = mocks.effects[0]();
    jest.advanceTimersByTime(31000);
    expect(fetch).not.toHaveBeenCalled();
    window.dispatchEvent(new Event("focus"));
    expect(fetch).toHaveBeenCalledTimes(1);
    if (typeof cleanup === "function") cleanup();
  });
  it("skips requests in hidden tabs", () => {
    stubGlobal("document", { visibilityState: "hidden" });
    AdsProvider({ children: null });
    const cleanup = mocks.effects[0]();
    expect(fetch).not.toHaveBeenCalled();
    if (typeof cleanup === "function") cleanup();
  });
});
