/* eslint-disable react-hooks/immutability -- This test harness deliberately mutates a simulated hook store. */
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { restoreGlobals, stubGlobal } from "./helpers/globals";

const harness = {
  actor: "member-a" as string | null, index: 0, hooks: [] as unknown[],
  effects: [] as Array<() => void>, cleanups: [] as Array<undefined | (() => void)>, counts: [] as number[],
};
const actualReact = await import("react");
mock.module("react", () => ({ ...actualReact,
  useState: (initial: unknown) => {
    const index = harness.index++;
    if (!(index in harness.hooks)) harness.hooks[index] = typeof initial === "function" ? initial() : initial;
    return [harness.hooks[index], (value: unknown) => {
      harness.hooks[index] = typeof value === "function" ? value(harness.hooks[index]) : value;
    }];
  },
  useRef: (initial: unknown) => {
    const index = harness.index++;
    if (!(index in harness.hooks)) harness.hooks[index] = { current: initial };
    return harness.hooks[index];
  },
  useCallback: (callback: unknown) => { harness.index++; return callback; },
  useEffect: (effect: () => undefined | (() => void), dependencies: unknown[]) => {
    const index = harness.index++;
    const previous = harness.hooks[index] as unknown[] | undefined;
    if (!previous || dependencies.some((value, i) => value !== previous[i])) {
      harness.hooks[index] = dependencies;
      harness.effects.push(() => { harness.cleanups[index]?.(); harness.cleanups[index] = effect(); });
    }
  },
}));
mock.module("@/lib/auth-client", () => ({ useSession: () => ({
  data: harness.actor ? { user: { id: harness.actor } } : null, isPending: false,
}) }));
const { useBlockedItems } = await import("@/app/settings/useBlockedItems");
type Item = { tagId: string };
const countChange = (value: number) => { harness.counts.push(value); };
function BlockedItemsHarness() {
  harness.index = 0;
  const result = useBlockedItems<Item>("/api/user/blocked-tags", "blockedTags", countChange);
  const effects = harness.effects.splice(0);
  effects.forEach((effect) => effect());
  return result;
}
async function settle() { await new Promise((resolve) => setImmediate(resolve)); return BlockedItemsHarness(); }

describe("private block-list recovery", () => {
  beforeEach(() => {
    harness.actor = "member-a"; harness.index = 0; harness.hooks = []; harness.effects = []; harness.cleanups = []; harness.counts = [];
  });
  afterEach(() => { harness.cleanups.forEach((cleanup) => cleanup?.()); restoreGlobals(); });
  it("retains the list and count on a rejected deletion and releases busy state for retry", async () => {
    let writes = 0;
    stubGlobal("fetch", async (_url: string, options: RequestInit) => {
      if (options?.method === "DELETE") return new Response(null, { status: ++writes === 1 ? 500 : 204 });
      return Response.json({ blockedTags: [{ tagId: "tag-a" }] });
    });
    BlockedItemsHarness(); let result = await settle();
    expect(result.items).toEqual([{ tagId: "tag-a" }]);
    expect(await result.mutate("tag-a", "/delete", { method: "DELETE" }, () => [])).toBe(false);
    result = BlockedItemsHarness();
    expect(result.items).toEqual([{ tagId: "tag-a" }]);
    expect(result.busy).toBeNull();
    expect(result.error).toContain("บันทึกไม่สำเร็จ");
    expect(await result.mutate("tag-a", "/delete", { method: "DELETE" }, () => [])).toBe(true);
    result = BlockedItemsHarness();
    expect(result.items).toEqual([]);
    expect(harness.counts.at(-1)).toBe(0);
  });
  it("ignores a late old-actor write acknowledgement after the account changes", async () => {
    let acknowledge!: (response: Response) => void;
    stubGlobal("fetch", async (_url: string, options: RequestInit) => {
      if (options?.method === "DELETE") return new Promise<Response>((resolve) => { acknowledge = resolve; });
      return Response.json({ blockedTags: [{ tagId: harness.actor }] });
    });
    BlockedItemsHarness(); const original = await settle();
    const pending = original.mutate("member-a", "/delete", { method: "DELETE" }, () => []);
    harness.actor = "member-b";
    expect(BlockedItemsHarness().items).toEqual([]);
    const updated = await settle();
    expect(updated.items).toEqual([{ tagId: "member-b" }]);
    acknowledge(new Response(null, { status: 204 }));
    expect(await pending).toBe(false);
    expect(BlockedItemsHarness().items).toEqual([{ tagId: "member-b" }]);
  });
  it("provides recovery after an initial network error", async () => {
    let reads = 0;
    stubGlobal("fetch", async () => {
      if (++reads === 1) throw new Error("offline");
      return Response.json({ blockedTags: [{ tagId: "tag-a" }] });
    });
    BlockedItemsHarness(); let result = await settle();
    expect(result.loading).toBe(false);
    expect(result.error).toBe("offline");
    result.refresh(); BlockedItemsHarness(); result = await settle();
    expect(result.error).toBe("");
    expect(result.items).toEqual([{ tagId: "tag-a" }]);
  });
});
