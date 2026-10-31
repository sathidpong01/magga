import { expect, it } from "bun:test";
import { POST } from "@/app/api/privacy/consent/route";
import { CONSENT_MAX_AGE, consentFromCookies, parseConsent } from "@/lib/privacy-consent";

it("accepts only the current version and valid, unexpired choices", () => {
  const now = Date.now();
  expect(parseConsent(`2.yes.${now}`, now)).toBe(true);
  expect(parseConsent(`2.no.${now}`, now)).toBe(false);
  for (const value of [undefined, "true", "false", `1.yes.${now}`, `2.yes.${now + 300_001}`, `2.yes.${now - CONSENT_MAX_AGE * 1000}`, "2.yes.NaN", `2.yes.${now}.extra`]) {
    expect(parseConsent(value, now)).toBeNull();
  }
  expect(consentFromCookies(`other=1; magga_consent=2.yes.${now}; session=abc`, now)).toBe(true);
  expect(consentFromCookies(`not_magga_consent=2.yes.${now}`, now)).toBeNull();
});

it.each([true, false])("recognizes saved choice %s when the browser clock is slightly behind the server", async statistics => {
  const browserNow = Date.now() - 60_000;
  const response = await save(statistics);
  const cookie = response.headers.getSetCookie().find(value => value.startsWith("magga_consent="))!;
  expect(consentFromCookies(cookie, browserNow)).toBe(statistics);
});

it.each([true, false])("saves choice %s when Next normalizes the loopback request URL", async statistics => {
  const response = await POST(new Request("http://localhost:3000/api/privacy/consent", {
    method: "POST", headers: { origin: "http://127.0.0.1:3000", host: "127.0.0.1:3000", "Content-Type": "application/json" },
    body: JSON.stringify({ statistics }),
  }));
  expect(response.status).toBe(200);
  expect(consentFromCookies(response.headers.getSetCookie().find(value => value.startsWith("magga_consent="))!)).toBe(statistics);
});

it("does not trust a forged forwarded host", async () => {
  const response = await POST(new Request("https://magga.example/api/privacy/consent", {
    method: "POST", headers: { origin: "https://foreign.example", host: "magga.example", "x-forwarded-host": "foreign.example", "Content-Type": "application/json" },
    body: JSON.stringify({ statistics: false }),
  }));
  expect(response.status).toBe(403);
  expect(response.headers.getSetCookie()).toEqual([]);
});

async function save(statistics: unknown, origin: string | null = "http://localhost") {
  return POST(new Request("http://localhost/api/privacy/consent", {
    method: "POST", headers: { "Content-Type": "application/json", ...(origin ? { origin } : {}) },
    body: JSON.stringify({ statistics }),
  }));
}
it.each([true, false])("saves choice %s with timestamp, expiry and clears the visitor identifier", async statistics => {
  const response = await save(statistics);
  expect(response.status).toBe(200);
  const cookies = response.headers.getSetCookie();
  const choice = cookies.find(cookie => cookie.startsWith("magga_consent="))!;
  expect(consentFromCookies(choice)).toBe(statistics);
  expect(choice).toContain(`Max-Age=${CONSENT_MAX_AGE}`);
  expect(choice).toContain("SameSite=lax");
  expect(cookies.find(cookie => cookie.startsWith("magga_vid="))).toContain("Max-Age=0");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});
it("rejects cross-origin requests and invalid choices without setting cookies", async () => {
  for (const response of [await save(true, "https://example.com"), await save(true, null), await save("yes")]) {
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.headers.getSetCookie()).toEqual([]);
  }
});
