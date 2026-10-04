import { describe, expect, it } from "vitest";
import { advertisementInput, advertisementUpdate, adEventInput } from "@/lib/advertisement-input";
import { adDeviceDisplay, adCtr } from "@/lib/advertisements";

const input = { type: "affiliate", title: "Campaign", imageUrl: "https://example.com/ad.webp", placement: "grid" };

describe("advertisement management", () => {
  it("creates drafts for all devices by default", () => {
    expect(advertisementInput.parse(input)).toMatchObject({ isActive: false, targetDevice: "all", repeatCount: 1 });
  });
  it("preserves selected repeat count and device", () => {
    expect(advertisementInput.parse({ ...input, repeatCount: 3, targetDevice: "mobile", isActive: true }))
      .toMatchObject({ repeatCount: 3, targetDevice: "mobile", isActive: true });
  });
  it("does not reset other settings when toggling status", () => {
    expect(advertisementUpdate.parse({ isActive: true })).toEqual({ isActive: true });
  });
  it.each([{ repeatCount: 0 }, { repeatCount: 100000 }, { targetDevice: "tablet" }, { linkUrl: "javascript:alert(1)" }, { title: " " }])("rejects invalid input %j", (override) => {
    expect(advertisementInput.safeParse({ ...input, ...override }).success).toBe(false);
  });
  it("prevents editing identifiers and metrics through management API", () => {
    expect(advertisementUpdate.parse({ title: "New", id: "other", impressions: 900, clicks: 10 })).toEqual({ title: "New" });
  });
  it("uses consistent device breakpoints", () => {
    expect(adDeviceDisplay("mobile")).toEqual({ xs: "block", md: "none" });
    expect(adDeviceDisplay("desktop")).toEqual({ xs: "none", md: "block" });
    expect(adDeviceDisplay("all")).toBe("block");
  });
  it("calculates CTR without dividing by zero", () => {
    expect(adCtr(0, 0)).toBe("0.00");
    expect(adCtr(200, 5)).toBe("2.50");
  });
  it("requires a valid event identifier and kind", () => {
    expect(adEventInput.safeParse({ eventId: "bad", kind: "impression" }).success).toBe(false);
  });
});
