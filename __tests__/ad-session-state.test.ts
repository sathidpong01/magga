import { afterEach, describe, expect, it } from "bun:test";
import { hasAdSessionFlag, setAdSessionFlag } from "@/lib/ad-session-state";
import { stubGlobal, restoreGlobals } from "./helpers/globals";
afterEach(restoreGlobals);
describe("restricted ad session storage", () => {
  it("retains modal and dismissal flags when browser storage throws", () => {
    stubGlobal("sessionStorage", { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); } });
    expect(hasAdSessionFlag("blocked-storage-modal")).toBe(false);
    setAdSessionFlag("blocked-storage-modal");
    expect(hasAdSessionFlag("blocked-storage-modal")).toBe(true);
  });
});
