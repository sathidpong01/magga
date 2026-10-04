import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ effects: [] as Array<() => void | (() => void)>, setState: vi.fn(), pathname: "/" }));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useState: (value: unknown) => [value, mocks.setState],
  useRef: (current: unknown) => ({ current }),
  useEffect: (effect: () => void | (() => void)) => { mocks.effects.push(effect); },
}));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
import { AdsProvider } from "@/app/components/features/ads/AdsProvider";

describe("advertisement request freshness", () => {
  beforeEach(() => {
    mocks.effects = [];
    mocks.setState.mockClear();
    vi.useFakeTimers();
    vi.setSystemTime(100000);
    vi.stubGlobal("window", new EventTarget());
    vi.stubGlobal("document", { visibilityState: "visible" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it("uses server data without an extra initial request", () => {
    AdsProvider({ children: null, initialAds: [] });
    const cleanup = mocks.effects[0]();
    mocks.effects[1]();
    window.dispatchEvent(new Event("focus"));
    expect(fetch).not.toHaveBeenCalled();
    if (typeof cleanup === "function") cleanup();
  });
  it("deduplicates mount, navigation and focus requests while pending", () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    AdsProvider({ children: null });
    const cleanup = mocks.effects[0]();
    mocks.effects[1]();
    window.dispatchEvent(new Event("focus"));
    expect(fetch).toHaveBeenCalledTimes(1);
    if (typeof cleanup === "function") cleanup();
    expect(vi.mocked(fetch).mock.calls[0][1]?.signal?.aborted).toBe(true);
  });
  it("refreshes on focus when the snapshot is stale", () => {
    AdsProvider({ children: null, initialAds: [] });
    const cleanup = mocks.effects[0]();
    vi.advanceTimersByTime(31000);
    expect(fetch).not.toHaveBeenCalled();
    window.dispatchEvent(new Event("focus"));
    expect(fetch).toHaveBeenCalledTimes(1);
    if (typeof cleanup === "function") cleanup();
  });
  it("skips requests in hidden tabs", () => {
    vi.stubGlobal("document", { visibilityState: "hidden" });
    AdsProvider({ children: null });
    const cleanup = mocks.effects[0]();
    expect(fetch).not.toHaveBeenCalled();
    if (typeof cleanup === "function") cleanup();
  });
});
