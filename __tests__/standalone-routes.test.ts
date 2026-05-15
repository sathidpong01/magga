import { describe, expect, it } from "vitest";
import { isMoxzkRoute, isStandaloneRoute } from "@/app/components/layout/standalone-routes";

describe("standalone route matching", () => {
  it("treats the Moxzk landing route as standalone regardless of case", () => {
    expect(isStandaloneRoute("/moxzk")).toBe(true);
    expect(isStandaloneRoute("/Moxzk")).toBe(true);
    expect(isMoxzkRoute("/moxzk")).toBe(true);
    expect(isMoxzkRoute("/Moxzk")).toBe(true);
  });

  it("matches nested standalone routes without matching unrelated prefixes", () => {
    expect(isStandaloneRoute("/moxzk/releases")).toBe(true);
    expect(isStandaloneRoute("/dashboard")).toBe(true);
    expect(isStandaloneRoute("/dashboard/admin")).toBe(true);
    expect(isStandaloneRoute("/moxzked")).toBe(false);
    expect(isStandaloneRoute("/")).toBe(false);
  });
});
