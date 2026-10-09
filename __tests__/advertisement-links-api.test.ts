import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";

const client = new PGlite();
const orm = drizzle(client, { schema });
let admin = true;
mock.module("@/db", () => ({ db: orm }));
mock.module("@/lib/auth", () => ({ auth: { api: { getSession: async () => admin ? { user: { role: "admin" } } : null } } }));
mock.module("@/lib/auth-helpers", () => ({ requireAdmin: () => admin ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }));
mock.module("next/cache", () => ({ unstable_cache: (fn: () => unknown) => fn, revalidateTag: () => {} }));
const { GET, POST } = await import("@/app/api/advertisements/route");
const { PATCH } = await import("@/app/api/advertisements/[id]/route");

const base = { type: "affiliate", title: "Campaign", imageUrl: "/ad.webp", placement: "grid", isActive: true };
const request = (body: object, method: string) => new NextRequest("http://localhost/api/advertisements", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const patch = (id: string, body: object) => PATCH(request(body, "PATCH"), { params: Promise.resolve({ id }) });

describe("advertisement link API using a fresh test database", () => {
  beforeAll(async () => {
    await client.exec(`CREATE TABLE advertisements (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), type text NOT NULL, title text NOT NULL,
      image_url text NOT NULL, link_url text, link_urls jsonb NOT NULL DEFAULT '[]', content text,
      placement text NOT NULL, repeat_count integer NOT NULL DEFAULT 1, target_device text NOT NULL DEFAULT 'all',
      impressions bigint NOT NULL DEFAULT 0, clicks bigint NOT NULL DEFAULT 0, is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
    );`);
  });
  afterAll(async () => { await client.close(); });
  beforeEach(async () => { admin = true; await client.exec("TRUNCATE advertisements;"); });

  it("creates from legacy input and exposes destinations in public and admin GET", async () => {
    const response = await POST(request({ ...base, linkUrl: "https://example.com" }, "POST"));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ linkUrls: ["https://example.com/"], linkUrl: "https://example.com/" });
    for (const suffix of ["?placement=grid", "?all=true"]) {
      const rows = await (await GET(new NextRequest(`http://localhost/api/advertisements${suffix}`))).json();
      expect(rows[0]).toMatchObject({ linkUrls: ["https://example.com/"], linkUrl: "https://example.com/" });
    }
  });
  it("replaces, preserves, and clears arrays with PATCH precedence", async () => {
    const created = await (await POST(request({ ...base, linkUrls: ["https://one.example", "https://two.example"] }, "POST"))).json();
    expect(await (await patch(created.id, { title: "Renamed" })).json()).toMatchObject({ linkUrls: ["https://one.example/", "https://two.example/"] });
    expect(await (await patch(created.id, { linkUrl: "https://old.example" })).json()).toMatchObject({ linkUrls: ["https://old.example/"], linkUrl: "https://old.example/" });
    expect(await (await patch(created.id, { linkUrls: ["https://new.example"], linkUrl: "javascript:ignored" })).json()).toMatchObject({ linkUrls: ["https://new.example/"], linkUrl: "https://new.example/" });
    expect(await (await patch(created.id, { linkUrls: [], linkUrl: "https://ignored.example" })).json()).toMatchObject({ linkUrls: [], linkUrl: null });
    expect(await (await patch(created.id, { linkUrl: null })).json()).toMatchObject({ linkUrls: [], linkUrl: null });
  });
  it("rejects unsafe POST/PATCH without changing stored destinations", async () => {
    const invalid = await POST(request({ ...base, linkUrls: ["https://user:pass@example.com"] }, "POST"));
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).details.fieldErrors.linkUrls).toBeDefined();
    const created = await (await POST(request({ ...base, linkUrl: "https://safe.example" }, "POST"))).json();
    expect((await patch(created.id, { linkUrls: ["//evil.example"] })).status).toBe(400);
    expect((await orm.query.advertisements.findMany())[0].linkUrls).toEqual(["https://safe.example/"]);
  });
  it("continues to protect management writes and inactive ads", async () => {
    const created = await (await POST(request({ ...base, isActive: false, linkUrls: [] }, "POST"))).json();
    expect(await (await GET(new NextRequest("http://localhost/api/advertisements"))).json()).toEqual([]);
    admin = false;
    expect((await POST(request(base, "POST"))).status).toBe(401);
    expect((await patch(created.id, { linkUrls: [] })).status).toBe(401);
    expect((await GET(new NextRequest("http://localhost/api/advertisements?all=true"))).status).toBe(401);
  });
});
