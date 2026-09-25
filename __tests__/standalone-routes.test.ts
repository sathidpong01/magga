import { describe, expect, it } from "vitest";
import { isStandaloneRoute } from "@/app/components/layout/standalone-routes";

describe("standalone route matching", () => {
  it("treats dashboard routes as standalone regardless of case", () => {
    expect(isStandaloneRoute("/dashboard")).toBe(true);
    expect(isStandaloneRoute("/Dashboard")).toBe(true);
  });

  it("matches nested standalone routes without matching unrelated prefixes", () => {
    expect(isStandaloneRoute("/dashboard")).toBe(true);
    expect(isStandaloneRoute("/dashboard/admin")).toBe(true);
    expect(isStandaloneRoute("/dashboarded")).toBe(false);
    expect(isStandaloneRoute("/moxzk")).toBe(false);
    expect(isStandaloneRoute("/")).toBe(false);
  });
});
