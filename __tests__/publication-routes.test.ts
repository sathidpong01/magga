import { afterEach, beforeEach, expect, it, jest, mock } from "bun:test";
import { restoreGlobals, stubGlobal } from "./helpers/globals";

const session = jest.fn();
const publish = jest.fn();
mock.module("@/db", () => ({ db: {} }));
mock.module("@/lib/auth", () => ({ auth: { api: { getSession: session } } }));
mock.module("@/lib/manga-publication", () => ({ publishScheduledManga: publish }));
mock.module("@/lib/manga-invalidation", () => ({ invalidateMangaContent: () => true }));
const { GET: getTime } = await import("@/app/api/admin/time/route");
const { GET: runPublisher } = await import("@/app/api/cron/publish-manga/route");

beforeEach(() => {
  stubGlobal("process", { ...process, env: { ...process.env, CRON_SECRET: "synthetic-publication-secret" } });
  session.mockReset();
  publish.mockReset();
});
afterEach(restoreGlobals);
it("requires fresh, non-banned admin authorization for server time", async () => {
  for (const user of [null, { id: "reader", role: "user" }, { id: "admin", role: "admin", banned: true }]) {
    session.mockResolvedValue(user ? { user } : null);
    expect([401, 403]).toContain((await getTime(new Request("https://example.invalid/api/admin/time"))).status);
  }
  session.mockResolvedValue({ user: { id: "admin", role: "admin" } });
  const response = await getTime(new Request("https://example.invalid/api/admin/time"));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(Math.abs(Date.parse((await response.json()).now) - Date.now())).toBeLessThan(1000);
  expect(session.mock.calls.at(-1)![0].query.disableCookieCache).toBe(true);
});
it("accepts only the configured bearer secret and never a query-string credential", async () => {
  for (const authorization of ["", "Bearer wrong", "Bearer synthetic-publication-secreT", "Basic synthetic-publication-secret", "Bearer é"]) {
    const response = await runPublisher(new Request("https://example.invalid/api/cron/publish-manga?secret=synthetic-publication-secret", { headers: { authorization } }));
    expect(response.status).toBe(401);
  }
  expect(publish).not.toHaveBeenCalled();
  delete process.env.CRON_SECRET;
  expect((await runPublisher(new Request("https://example.invalid/api/cron/publish-manga", { headers: { authorization: "Bearer undefined" } }))).status).toBe(401);
});
it("reports retryable cache failures without replaying an unauthorized job", async () => {
  publish.mockResolvedValue({ published: 1, cacheRefreshPending: true });
  const request = new Request("https://example.invalid/api/cron/publish-manga", { headers: { authorization: "Bearer synthetic-publication-secret" } });
  const response = await runPublisher(request);
  expect(response.status).toBe(503);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  publish.mockResolvedValue({ published: 1, cacheRefreshPending: false });
  expect((await runPublisher(request)).status).toBe(200);
});
