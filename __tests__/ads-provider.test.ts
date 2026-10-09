import { beforeEach, afterEach, describe, expect, it, jest, mock } from "bun:test";
import { stubGlobal, restoreGlobals } from "./helpers/globals";

const fetchMock = jest.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Partial<Response>>>();
const mocks = { effects: [] as Array<() => void | (() => void)>, states: [] as unknown[], stateIndex: 0 };
const originalReact = await import("react");
mock.module("react", () => ({
  ...originalReact,
  useState: (value: unknown) => {
    const index = mocks.stateIndex++;
    if (!(index in mocks.states)) mocks.states[index] = value;
    return [mocks.states[index], (next: unknown) => { mocks.states[index] = next; }];
  },
  useEffect: (effect: () => void | (() => void)) => { mocks.effects.push(effect); },
}));
const { AdsProvider } = await import("@/app/components/features/ads/AdsProvider");
const campaign = {
  id: "ad-1", type: "affiliate", title: "Test", imageUrl: "/test.svg", placement: "grid",
  linkUrls: ["https://first.example", "https://second.example"],
};
function render(initialAds?: typeof campaign[]) {
  mocks.stateIndex = 0;
  return AdsProvider({ children: null, initialAds }).props.value;
}
async function settle() {
  await new Promise((resolve) => setImmediate(resolve));
}

describe("advertisements stay fixed until document reload", () => {
  beforeEach(() => {
    mocks.effects = [];
    mocks.states = [];
    mocks.stateIndex = 0;
    jest.useFakeTimers();
    stubGlobal("window", new EventTarget());
    stubGlobal("fetch", fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => [campaign] }));
  });
  afterEach(() => { jest.useRealTimers(); restoreGlobals(); });

  it("selects once after hydration, keeps the snapshot on navigation/focus, and reselects on reload", () => {
    const random = jest.spyOn(Math, "random").mockReturnValue(0.9);
    try {
      expect(render([campaign]).getAdsByPlacement("grid")[0].linkUrls).toEqual(campaign.linkUrls);
      expect(random).not.toHaveBeenCalled();
      mocks.effects[0]();
      const selected = render([campaign]).getAdsByPlacement("grid")[0];
      expect(selected.linkUrl).toBe("https://second.example/");
      expect(selected.linkUrls).toEqual(["https://second.example/"]);
      expect(campaign.linkUrls).toEqual(["https://first.example", "https://second.example"]);
      jest.advanceTimersByTime(600000);
      window.dispatchEvent(new Event("focus"));
      expect(render([{ ...campaign, linkUrls: ["https://changed.example"] }]).getAdsByPlacement("grid")[0]).toBe(selected);
      expect(fetch).not.toHaveBeenCalled();
      expect(random).toHaveBeenCalledTimes(1);

      mocks.states = [];
      mocks.effects = [];
      random.mockReturnValue(0);
      render([campaign]);
      mocks.effects[0]();
      expect(render([campaign]).getAdsByPlacement("grid")[0].linkUrl).toBe("https://first.example/");
      expect(random).toHaveBeenCalledTimes(2);
    } finally { random.mockRestore(); }
  });

  it("does not fetch when the server snapshot is empty", () => {
    render([]);
    mocks.effects[0]();
    window.dispatchEvent(new Event("focus"));
    expect(fetch).not.toHaveBeenCalled();
    expect(render([]).isLoading).toBe(false);
  });

  it("fetches once without a server snapshot and never refreshes on focus", async () => {
    jest.useRealTimers();
    render();
    const cleanup = mocks.effects[0]();
    await settle();
    window.dispatchEvent(new Event("focus"));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(render().getAdsByPlacement("grid")[0].linkUrls).toHaveLength(1);
    expect(render().isLoading).toBe(false);
    if (typeof cleanup === "function") cleanup();
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });

  it("aborts pending requests and ignores results after unmount", async () => {
    jest.useRealTimers();
    let resolveResponse!: (response: Partial<Response>) => void;
    fetchMock.mockReturnValue(new Promise((resolve) => { resolveResponse = resolve; }));
    render();
    const cleanup = mocks.effects[0]();
    if (typeof cleanup === "function") cleanup();
    resolveResponse({ ok: true, json: async () => [campaign] });
    await settle();
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(render().getAdsByPlacement("grid")).toEqual([]);
  });
});
