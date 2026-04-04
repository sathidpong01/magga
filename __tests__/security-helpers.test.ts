import { describe, expect, it } from "vitest";

import { detectImageFormat, sanitizeObjectKeySegment } from "../lib/image-security";
import { isPrivateIpAddress } from "../lib/network-security";

describe("image security helpers", () => {
  it("detects common image signatures and sanitizes object key segments", () => {
    const pngBuffer = Buffer.from("89504e470d0a1a0a", "hex");
    const jpgBuffer = Buffer.from("ffd8ffe000104a464946", "hex");

    expect(detectImageFormat(pngBuffer)).toBe("png");
    expect(detectImageFormat(jpgBuffer)).toBe("jpeg");
    expect(sanitizeObjectKeySegment("../weird folder/slug", "fallback")).toBe("weird-folder-slug");
  });
});

describe("network security helpers", () => {
  it("flags private and loopback addresses", () => {
    expect(isPrivateIpAddress("127.0.0.1")).toBe(true);
    expect(isPrivateIpAddress("10.20.30.40")).toBe(true);
    expect(isPrivateIpAddress("::1")).toBe(true);
    expect(isPrivateIpAddress("::ffff:192.168.1.2")).toBe(true);
    expect(isPrivateIpAddress("8.8.8.8")).toBe(false);
  });
});
