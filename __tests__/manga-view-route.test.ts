import { afterAll, beforeAll, beforeEach, expect, it, mock, spyOn } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { NextRequest } from "next/server";

const pg = new PGlite();
const database = drizzle(pg);
const quota = mock<typeof import("@/lib/rate-limit").checkRateLimit>();
mock.module("@/db", () => ({ db: database }));
mock.module("@/lib/rate-limit", () => ({ checkRateLimit: quota }));
const { POST } = await import("@/app/api/manga/[id]/view/route");
const info = spyOn(console, "info").mockImplementation(() => {});
const warn = spyOn(console, "warn").mockImplementation(() => {});
const error = spyOn(console, "error").mockImplementation(() => {});
const oldVercel = process.env.VERCEL;
const id = "11111111-1111-4111-8111-111111111111";
const eventId = "22222222-2222-4222-8222-222222222222";
const params = { params: Promise.resolve({ id }) };

function request(body?: string, visitorCookie = "") {
  return new NextRequest(`http://localhost/api/manga/${id}/view`, {
    method: "POST", body,
    headers: { "Content-Type": "application/json", cookie: `magga_consent=2.yes.${Date.now()}; ${visitorCookie}` },
  });
}

beforeAll(async () => {
  await pg.exec(`CREATE TABLE manga(id uuid PRIMARY KEY,is_hidden boolean DEFAULT false,view_count bigint DEFAULT 0);
    CREATE TABLE manga_views(manga_id uuid REFERENCES manga(id),ip_hash text,viewed_at timestamptz,PRIMARY KEY(manga_id,ip_hash));`);
}, 30000);
beforeEach(async () => {
  delete process.env.VERCEL;
  quota.mockReset().mockResolvedValue({ allowed: true, remaining: 239 });
  info.mockClear(); warn.mockClear(); error.mockClear();
  await pg.exec(`TRUNCATE manga_views,manga; INSERT INTO manga(id) VALUES('${id}');`);
});
afterAll(async () => {
  if (oldVercel === undefined) delete process.env.VERCEL; else process.env.VERCEL = oldVercel;
  info.mockRestore(); warn.mockRestore(); error.mockRestore();
  await pg.close();
});

it("counts a lost-response retry once even without the original visitor cookie", async () => {
  const first = await POST(request(JSON.stringify({ eventId })), params);
  expect(await first.json()).toEqual({ viewCount: 1, deduplicated: false });
  const retry = await POST(request(JSON.stringify({ eventId })), params);
  expect(await retry.json()).toEqual({ viewCount: 1, deduplicated: true });
  expect(retry.headers.get("Cache-Control")).toBe("private, no-store");
  expect(info.mock.calls.map(([entry]) => JSON.parse(String(entry)).outcome)).toEqual(["counted", "deduplicated"]);
  expect(JSON.stringify(info.mock.calls)).not.toContain(eventId);
  expect(JSON.stringify(info.mock.calls)).not.toContain("magga_vid");
  const recoveredCookie = retry.headers.getSetCookie()[0].split(";")[0];
  const refresh = request(JSON.stringify({ eventId: crypto.randomUUID() }), recoveredCookie);
  expect(await (await POST(refresh, params)).json()).toEqual({ viewCount: 1, deduplicated: true });
});

it("keeps visitor deduplication across new event IDs and counts again after ten minutes", async () => {
  const first = await POST(request(JSON.stringify({ eventId })), params);
  const visitorCookie = first.headers.getSetCookie()[0].split(";")[0];
  const next = () => request(JSON.stringify({ eventId: crypto.randomUUID() }), visitorCookie);
  expect(await (await POST(next(), params)).json()).toEqual({ viewCount: 1, deduplicated: true });
  await pg.exec("UPDATE manga_views SET viewed_at=NOW()-INTERVAL '11 minutes'");
  expect(await (await POST(next(), params)).json()).toEqual({ viewCount: 2, deduplicated: false });
});

it("preserves callers with no request body", async () => {
  expect(await (await POST(request(), params)).json()).toEqual({ viewCount: 1, deduplicated: false });
});

it.each(['{"eventId":"invalid"}', "{", "null", "[]"])("rejects invalid event input before quota or writes: %s", async body => {
  expect((await POST(request(body), params)).status).toBe(400);
  expect(quota).not.toHaveBeenCalled();
  expect((await pg.query("SELECT * FROM manga_views")).rows).toHaveLength(0);
});

it("reports a real rate limit with Retry-After and no view writes", async () => {
  quota.mockResolvedValue({ allowed: false, remaining: 0, resetTime: Date.now() + 60_000 });
  const response = await POST(request(JSON.stringify({ eventId })), params);
  expect(response.status).toBe(429);
  expect(Number(response.headers.get("Retry-After"))).toBeGreaterThanOrEqual(59);
  expect(JSON.parse(String(warn.mock.calls[0][0])).outcome).toBe("rate_limited");
  expect((await pg.query("SELECT * FROM manga_views")).rows).toHaveLength(0);
});

it("reports quota storage failure as retryable 503 instead of a rate limit", async () => {
  quota.mockResolvedValue({ allowed: false, remaining: 0 });
  expect((await POST(request(JSON.stringify({ eventId })), params)).status).toBe(503);
  expect(JSON.parse(String(warn.mock.calls[0][0]))).toMatchObject({ outcome: "failed", reason: "quota_unavailable" });
});

it("reports missing trusted network identity without recording a view", async () => {
  process.env.VERCEL = "1";
  expect((await POST(request(JSON.stringify({ eventId })), params)).status).toBe(503);
  expect(quota).not.toHaveBeenCalled();
  expect(JSON.parse(String(warn.mock.calls[0][0]))).toMatchObject({ outcome: "failed", reason: "network_identity_unavailable" });
});

it("rolls back both retry and visitor markers when storage fails", async () => {
  await pg.exec("CREATE FUNCTION reject_view() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'private fixture details'; END $$; CREATE TRIGGER fail_view BEFORE UPDATE ON manga FOR EACH ROW EXECUTE FUNCTION reject_view();");
  try {
    expect((await POST(request(JSON.stringify({ eventId })), params)).status).toBe(500);
    expect((await pg.query("SELECT * FROM manga_views")).rows).toHaveLength(0);
    expect(JSON.parse(String(error.mock.calls[0][0]))).toMatchObject({ outcome: "failed", reason: "storage_error" });
    expect(JSON.stringify(error.mock.calls)).not.toContain("private fixture details");
  } finally {
    await pg.exec("DROP TRIGGER fail_view ON manga; DROP FUNCTION reject_view()");
  }
  expect(await (await POST(request(JSON.stringify({ eventId })), params)).json()).toEqual({ viewCount: 1, deduplicated: false });
});
