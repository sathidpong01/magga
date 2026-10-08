import { beforeEach, afterEach, describe, expect, it, jest, mock } from "bun:test";
import { stubGlobal, restoreGlobals } from "./helpers/globals";

const fetchMock = jest.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Partial<Response>>>();
const mocks = { effects: [] as Array<() => void | (() => void)>, pathname: "/", observe: jest.fn(), disconnect: jest.fn(), callback: undefined as undefined | ((entries: object[]) => void) };
const originalReact = await import("react");
mock.module("react", () => ({
  ...originalReact,
  useState: (value: unknown) => [value, jest.fn()],
  useRef: (current: unknown) => ({ current }),
  useEffect: (effect: () => void | (() => void)) => { mocks.effects.push(effect); },
}));
mock.module("next/navigation", () => ({ usePathname: () => mocks.pathname }));
const { useAdTracking } = await import("@/app/components/features/ads/useAdTracking");

function TrackingHarness() {
  const tracking = useAdTracking("11111111-1111-4111-8111-111111111111");
  tracking.imageRef.current = { complete: true, naturalWidth: 512 } as HTMLImageElement;
  mocks.effects[0]();
  const cleanup = mocks.effects[1]();
  return { tracking, cleanup };
}

describe("viewable advertisement tracking", () => {
  beforeEach(() => {
    mocks.effects = [];
    mocks.pathname = "/";
    mocks.callback = undefined;
    jest.useFakeTimers();
    stubGlobal("fetch", fetchMock.mockReset().mockResolvedValue({ ok: true }));
    stubGlobal("document", Object.assign(new EventTarget(), { visibilityState: "visible" }));
    stubGlobal("IntersectionObserver", class {
      constructor(callback: (entries: object[]) => void) { mocks.callback = callback; }
      observe = mocks.observe;
      unobserve = jest.fn();
      disconnect = mocks.disconnect;
    });
  });
  afterEach(() => { jest.useRealTimers(); restoreGlobals(); });

  it("requires half the image to stay visible for one second", () => {
    const { cleanup } = TrackingHarness();
    mocks.callback!([{ isIntersecting: true, intersectionRatio: 0.4 }]);
    jest.advanceTimersByTime(1200);
    expect(fetch).not.toHaveBeenCalled();
    mocks.callback!([{ isIntersecting: true, intersectionRatio: 0.6 }]);
    jest.advanceTimersByTime(999);
    expect(fetch).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    if (typeof cleanup === "function") cleanup();
  });
  it("cancels a partial impression when the image leaves the viewport", () => {
    const { cleanup } = TrackingHarness();
    mocks.callback!([{ isIntersecting: true, intersectionRatio: 1 }]);
    jest.advanceTimersByTime(500);
    mocks.callback!([{ isIntersecting: false, intersectionRatio: 0 }]);
    jest.advanceTimersByTime(1500);
    expect(fetch).not.toHaveBeenCalled();
    if (typeof cleanup === "function") cleanup();
  });
  it("records an early click with an impression and deduplicates repeated clicks", () => {
    const { tracking, cleanup } = TrackingHarness();
    tracking.onClick();
    tracking.onClick();
    expect(fetchMock.mock.calls.map((call) => JSON.parse(call[1]!.body as string).kind)).toEqual(["impression", "click"]);
    if (typeof cleanup === "function") cleanup();
  });
  it("does not count dashboard previews", () => {
    mocks.pathname = "/dashboard/admin/advertisements";
    const { tracking, cleanup } = TrackingHarness();
    tracking.onClick();
    mocks.callback!([{ isIntersecting: true, intersectionRatio: 1 }]);
    jest.advanceTimersByTime(1500);
    expect(fetch).not.toHaveBeenCalled();
    if (typeof cleanup === "function") cleanup();
  });
});
