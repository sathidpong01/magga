import { expect, it } from "bun:test";
import { isValidCallbackUrl } from "@/lib/callback-url";
import { getQuotaClientIp } from "@/lib/network-security";

it("callback parser rejects alternate external authorities and controls", () => {
  for (const url of ["/\\evil.test", "/\\\\evil.test", "/\t/evil.test", "/\n/evil.test", "//evil.test", "https://evil.test", "javascript:alert(1)", "/a\r/b", "/a/..//evil.test", "/%2e//evil.test", "/.//evil.test", "/a/%2e%2e//evil.test"])
    expect(isValidCallbackUrl(url)).toBe("/");
  for (const url of ["/settings?next=https://example.test#profile", "/manga/a%20b", "/?q=%2F%5Cexample.test", "/"])
    expect(isValidCallbackUrl(url)).toBe(url);
  expect(isValidCallbackUrl("/a/../settings")).toBe("/settings");
});

it("local quota fallback stays stable and Vercel requires a valid trusted IP", () => {
  const headers = new Headers({ "x-forwarded-for": "1.2.3.4", "x-real-ip": "4.3.2.1" });
  expect(getQuotaClientIp(headers, false)).toBe("local");
  expect(getQuotaClientIp(headers, true)).toBeNull();
  headers.set("x-vercel-forwarded-for", "198.51.100.10");
  expect(getQuotaClientIp(headers, true)).toBe("198.51.100.10");
  headers.set("x-vercel-forwarded-for", "forged");
  expect(getQuotaClientIp(headers, true)).toBeNull();
});
