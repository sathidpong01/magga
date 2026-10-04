import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ effects: [] as Array<() => void | (() => void)>, pathname: "/", observe: vi.fn(), disconnect: vi.fn(), callback: undefined as undefined | ((entries: object[]) => void) }));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useState: (value: unknown) => [value, vi.fn()],
  useRef: (current: unknown) => ({ current }),
  useEffect: (effect: () => void | (() => void)) => { mocks.effects.push(effect); },
}));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
import { useAdTracking } from "@/app/components/features/ads/useAdTracking";

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
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    vi.stubGlobal("document", Object.assign(new EventTarget(), { visibilityState: "visible" }));
    vi.stubGlobal("IntersectionObserver", class {
      constructor(callback: (entries: object[]) => void) { mocks.callback = callback; }
      observe = mocks.observe;
      unobserve = vi.fn();
      disconnect = mocks.disconnect;
    });
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it("requires half the image to stay visible for one second", () => {
    const { cleanup } = TrackingHarness();
    mocks.callback!([{ isIntersecting: true, intersectionRatio: 0.4 }]);
    vi.advanceTimersByTime(1200);
    expect(fetch).not.toHaveBeenCalled();
    mocks.callback!([{ isIntersecting: true, intersectionRatio: 0.6 }]);
    vi.advanceTimersByTime(999);
    expect(fetch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    if (typeof cleanup === "function") cleanup();
  });
  it("cancels a partial impression when the image leaves the viewport", () => {
    const { cleanup } = TrackingHarness();
    mocks.callback!([{ isIntersecting: true, intersectionRatio: 1 }]);
    vi.advanceTimersByTime(500);
    mocks.callback!([{ isIntersecting: false, intersectionRatio: 0 }]);
    vi.advanceTimersByTime(1500);
    expect(fetch).not.toHaveBeenCalled();
    if (typeof cleanup === "function") cleanup();
  });
  it("records an early click with an impression and deduplicates repeated clicks", () => {
    const { tracking, cleanup } = TrackingHarness();
    tracking.onClick();
    tracking.onClick();
    expect(vi.mocked(fetch).mock.calls.map((call) => JSON.parse(call[1]!.body as string).kind)).toEqual(["impression", "click"]);
    if (typeof cleanup === "function") cleanup();
  });
  it("does not count dashboard previews", () => {
    mocks.pathname = "/dashboard/admin/advertisements";
    const { tracking, cleanup } = TrackingHarness();
    tracking.onClick();
    mocks.callback!([{ isIntersecting: true, intersectionRatio: 1 }]);
    vi.advanceTimersByTime(1500);
    expect(fetch).not.toHaveBeenCalled();
    if (typeof cleanup === "function") cleanup();
  });
});
