import { describe, expect, it } from "bun:test";
import { isPrivateIpAddress, resolveExternalUrl } from "../lib/network-security";
describe("canonical external address guards", () => {
  it("blocks expanded, bracketed and hexadecimal mapped private IPv6", () => {
    for (const value of ["0:0:0:0:0:0:0:0", "::ffff:7f00:1", "0:0:0:0:0:ffff:a00:1", "[::1]", "fe80::1", "64:ff9b::7f00:1", "100.64.0.1", "2002:7f00:1::", "2001:0:4136:e378:8000:63bf:3fff:fdd2"]) expect(isPrivateIpAddress(value)).toBe(true);
    expect(isPrivateIpAddress("::ffff:808:808")).toBe(false);
    expect(isPrivateIpAddress("2606:4700:4700::1111")).toBe(false);
  });
  it("rejects mixed DNS answers and returns only the checked public address", async () => {
    const mixed = async () => [{ address: "8.8.8.8", family: 4 }, { address: "127.0.0.1", family: 4 }];
    expect((await resolveExternalUrl("https://fixture.example/", mixed as any)).valid).toBe(false);
    const publicOnly = async () => [{ address: "8.8.8.8", family: 4 }];
    const resolved = await resolveExternalUrl("https://fixture.example/", publicOnly as any);
    expect(resolved.valid).toBe(true);
    if (resolved.valid) expect(resolved.addresses).toEqual([{ address: "8.8.8.8", family: 4 }]);
    expect((await resolveExternalUrl("http://localhost./")).valid).toBe(false);
  });
});
