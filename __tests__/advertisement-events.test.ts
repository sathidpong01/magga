import { afterAll, beforeAll, beforeEach, describe, expect, it, jest, mock } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync } from "node:fs";

const mocks = { execute: jest.fn(), rateLimit: jest.fn() };
mock.module("@/db", () => ({ db: { execute: mocks.execute } }));
mock.module("@/lib/rate-limit", () => ({ checkRateLimit: mocks.rateLimit }));
const { POST } = await import("@/app/api/advertisements/[id]/events/route");

const adId = "11111111-1111-4111-8111-111111111111";
const eventId = "22222222-2222-4222-8222-222222222222";
const client = new PGlite();

async function record(kind = "impression", event = eventId, origin = "http://localhost") {
  return POST(new Request(`http://localhost/api/advertisements/${adId}/events`, {
    method: "POST", headers: { "Content-Type": "application/json", origin },
    body: JSON.stringify({ kind, eventId: event }),
  }), { params: Promise.resolve({ id: adId }) });
}

async function metrics() {
  const { rows } = await client.query<{ impressions: number; clicks: number }>("SELECT impressions, clicks FROM advertisements");
  return { impressions: Number(rows[0].impressions), clicks: Number(rows[0].clicks) };
}

describe("advertisement migration and tracking", () => {
  beforeAll(async () => {
    await client.exec(`CREATE TABLE advertisements (
      id uuid PRIMARY KEY, is_active boolean DEFAULT true NOT NULL, link_url text
    ); INSERT INTO advertisements VALUES ('${adId}', true, 'https://example.com');`);
    await client.exec(readFileSync("db/migrations/0012_advertisement_management.sql", "utf8"));
    const orm = drizzle(client);
    mocks.execute.mockImplementation((query) => orm.execute(query));
  });
  afterAll(async () => { await client.close(); });
  beforeEach(async () => {
    mocks.rateLimit.mockResolvedValue({ allowed: true });
    await client.exec("TRUNCATE advertisement_events; UPDATE advertisements SET impressions = 0, clicks = 0, is_active = true, link_url = 'https://example.com';");
  });

  it("keeps existing active campaigns for all devices", async () => {
    const { rows } = await client.query("SELECT is_active, target_device FROM advertisements");
    expect(rows[0]).toEqual({ is_active: true, target_device: "all" });
  });
  it("counts an impression and click once each despite retries", async () => {
    expect((await record()).status).toBe(204);
    await record();
    await record("click");
    await record("click");
    expect(await metrics()).toEqual({ impressions: 1, clicks: 1 });
  });
  it("counts distinct views atomically", async () => {
    await Promise.all([record(), record("impression", "33333333-3333-4333-8333-333333333333")]);
    expect(await metrics()).toEqual({ impressions: 2, clicks: 0 });
  });
  it("does not count drafts", async () => {
    await client.exec("UPDATE advertisements SET is_active = false");
    await record();
    expect(await metrics()).toEqual({ impressions: 0, clicks: 0 });
  });
  it("does not count clicks on ads without a destination", async () => {
    await client.exec("UPDATE advertisements SET link_url = null");
    await record("click");
    expect(await metrics()).toEqual({ impressions: 0, clicks: 0 });
  });
  it("rejects malformed and cross-origin events", async () => {
    expect((await record("impression", "invalid")).status).toBe(400);
    expect((await record("impression", eventId, "https://example.com")).status).toBe(403);
    expect(await metrics()).toEqual({ impressions: 0, clicks: 0 });
  });
  it("rate limits recording", async () => {
    mocks.rateLimit.mockResolvedValue({ allowed: false });
    expect((await record()).status).toBe(429);
    expect(await metrics()).toEqual({ impressions: 0, clicks: 0 });
  });
});
