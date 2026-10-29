import { afterAll, beforeAll, beforeEach, expect, it, jest, mock } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { NextRequest } from "next/server";
import * as schema from "@/db/schema";
import * as relations from "@/db/relations";

const pg = new PGlite();
const db = drizzle(pg, { schema: { ...schema, ...relations } });
const state = { current: { id: "owner", email: "old@example.test", role: "admin", banned: false }, revoked: false };
const getSession = jest.fn(async (input: { query?: { disableCookieCache?: boolean } }) => {
  // A retained signed cookie still claims admin; only authoritative reads see revocation.
  if (!input.query?.disableCookieCache) return { user: { ...state.current, role: "admin", banned: false } };
  return state.revoked ? null : { user: state.current };
});
const quota = jest.fn(async (_key: string) => ({ allowed: true, remaining: 1 }));
const recordView = jest.fn(async () => ({ viewCount: 1 }));
const recordRating = jest.fn(async () => ({ averageRating: 5 }));
mock.module("@/db", () => ({ db }));
mock.module("@/lib/auth", () => ({ auth: { api: { getSession } } }));
mock.module("@/lib/rate-limit", () => ({ checkRateLimit: quota }));
mock.module("@/lib/manga-statistics", () => ({ recordMangaView: recordView, recordMangaRating: recordRating }));
mock.module("next/cache", () => ({ unstable_cache: (fn: () => unknown) => fn, revalidateTag: () => {} }));
const { PUT: profile } = await import("@/app/api/user/profile/route");
const { GET: history } = await import("@/app/api/user/my-comments/route");
const { POST: createAd } = await import("@/app/api/advertisements/route");
const { PATCH: updateAd, DELETE: deleteAd } = await import("@/app/api/advertisements/[id]/route");
const { POST: view } = await import("@/app/api/manga/[id]/view/route");
const { POST: rate } = await import("@/app/api/manga/[id]/rating/route");
const id = "11111111-1111-4111-8111-111111111111";
const params = { params: Promise.resolve({ id }) };
const request = (body: object, method = "PUT", headers = {}) => new NextRequest("http://localhost/api/test", {
  method, headers: { "Content-Type": "application/json", cookie: `magga_consent=2.yes.${Date.now()}`, ...headers }, body: JSON.stringify(body),
});
const oldVercel = process.env.VERCEL;
beforeAll(async () => {
  await pg.exec(`CREATE TABLE profiles(id text PRIMARY KEY,name text,email text UNIQUE,email_verified boolean,image text,username text,display_username text,password text,role text DEFAULT 'user',is_banned boolean DEFAULT false,ban_reason text,ban_expires timestamptz,banned_at timestamptz,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now(),banned boolean DEFAULT false,comment_preference text DEFAULT 'sidebar');
    CREATE TABLE manga(id uuid PRIMARY KEY,title text,slug text,cover_image text,is_hidden boolean);
    CREATE TABLE comments(id uuid DEFAULT gen_random_uuid(),user_id text,parent_id uuid,manga_id uuid,content text,image_url text,vote_score int,created_at timestamptz DEFAULT now(),image_index int);
    CREATE TABLE advertisements(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),type text,title text,image_url text,link_url text,link_urls jsonb,content text,placement text,repeat_count int,target_device text,impressions bigint DEFAULT 0,clicks bigint DEFAULT 0,is_active boolean,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());`);
});
beforeEach(async () => {
  delete process.env.VERCEL;
  Object.assign(state, { current: { id: "owner", email: "old@example.test", role: "admin", banned: false }, revoked: false });
  quota.mockClear(); recordView.mockClear(); recordRating.mockClear();
  await pg.exec("TRUNCATE profiles,manga,comments,advertisements; INSERT INTO profiles(id,email,email_verified) VALUES('owner','old@example.test',true);");
});
afterAll(async () => { if (oldVercel === undefined) delete process.env.VERCEL; else process.env.VERCEL = oldVercel; await pg.close(); });

it("email changes clear verification atomically; same-email and name-only saves preserve it", async () => {
  await pg.exec("INSERT INTO profiles(id,email,email_verified) VALUES('other','taken@example.test',true)");
  expect((await profile(request({ email: "Taken@Example.Test" }))).status).toBe(400);
  expect((await profile(request({ name: "Name", email: "old@example.test" }))).status).toBe(200);
  expect((await db.query.profiles.findMany()).find(row => row.id === "owner")?.emailVerified).toBe(true);
  expect((await profile(request({ email: "NEW@example.test" }))).status).toBe(200);
  expect((await db.query.profiles.findMany()).find(row => row.id === "owner")).toMatchObject({ email: "new@example.test", emailVerified: false });
  expect((await profile(request({ name: "Another name" }))).status).toBe(200);
  expect((await db.query.profiles.findMany()).find(row => row.id === "owner")?.emailVerified).toBe(false);
});

it("history filters hidden works before pagination and refreshes visibility", async () => {
  await pg.query("INSERT INTO manga VALUES($1,'Secret new title','secret-slug','secret-cover',true),($2,'Public','public','cover',false)", [id, "22222222-2222-4222-8222-222222222222"]);
  await pg.exec("INSERT INTO comments(user_id,manga_id,content) SELECT 'owner',id,'Own comment' FROM manga; INSERT INTO comments(user_id,manga_id,content) SELECT 'other',id,'Other comment' FROM manga;");
  state.current.role = "user";
  const response = await history(new Request("http://localhost/api/user/my-comments"));
  expect(response.headers.get("cache-control")).toContain("no-store");
  const data = await response.json();
  expect(data.comments).toHaveLength(1);
  expect(JSON.stringify(data)).not.toContain("Secret");
  expect(data.comments[0].manga.title).toBe("Public");
  await pg.exec("UPDATE manga SET is_hidden=true");
  expect((await (await history(new Request("http://localhost/api/user/my-comments"))).json()).comments).toEqual([]);
  state.current.role = "admin";
  expect((await (await history(new Request("http://localhost/api/user/my-comments"))).json()).comments).toHaveLength(2);
});

it("retained admin cookies cannot create, edit or delete ads after demotion/ban/revocation", async () => {
  const base = { type: "affiliate", title: "Ad", imageUrl: "/ad.webp", placement: "grid", isActive: true };
  expect((await createAd(request(base, "POST"))).status).toBe(201);
  const ad = (await db.query.advertisements.findMany())[0];
  for (const mode of ["demoted", "banned", "revoked"]) {
    state.current.role = mode === "demoted" ? "user" : "admin";
    state.current.banned = mode === "banned"; state.revoked = mode === "revoked";
    expect((await createAd(request(base, "POST"))).status).toBe(mode === "revoked" ? 401 : 403);
    expect((await updateAd(request({ title: "Changed" }, "PATCH"), { params: Promise.resolve({ id: ad.id }) })).status).toBe(mode === "revoked" ? 401 : 403);
    expect((await deleteAd(new NextRequest("http://localhost/api/ad", { method: "DELETE" }), { params: Promise.resolve({ id: ad.id }) })).status).toBe(mode === "revoked" ? 401 : 403);
  }
  expect(await db.query.advertisements.findMany()).toHaveLength(1);
  expect((await db.query.advertisements.findMany())[0].title).toBe("Ad");
  state.revoked = false; state.current.banned = false;
  expect((await updateAd(request({ title: "Allowed" }, "PATCH"), { params: Promise.resolve({ id: ad.id }) })).status).toBe(200);
  expect((await deleteAd(new NextRequest("http://localhost/api/ad", { method: "DELETE" }), { params: Promise.resolve({ id: ad.id }) })).status).toBe(200);
});

it("statistics quotas ignore spoofed identity and fail closed without the Vercel header", async () => {
  process.env.VERCEL = "1";
  for (const spoof of ["10.0.0.1", "203.0.113.55"]) {
    const headers = { "x-vercel-forwarded-for": "198.51.100.20", "cf-connecting-ip": spoof, "x-real-ip": spoof };
    expect((await view(request({}, "POST", headers), params)).status).toBe(200);
    expect((await rate(request({ rating: 5, fingerprint: spoof }, "POST", headers), params)).status).toBe(200);
  }
  const keys = quota.mock.calls.map(call => call[0]);
  expect(keys[0]).toBe(keys[2]); expect(keys[1]).toBe(keys[3]);
  expect((await view(request({}, "POST", { "cf-connecting-ip": "198.51.100.20" }), params)).status).toBe(503);
  expect((await rate(request({ rating: 5, fingerprint: "fresh" }, "POST"), params)).status).toBe(503);
  expect(recordView).toHaveBeenCalledTimes(2); expect(recordRating).toHaveBeenCalledTimes(2);
});

it.each(["", `magga_consent=2.no.${Date.now()}`, "magga_consent=1.yes.1"])("view statistics skip quotas, writes and cookies without consent: %s", async cookie => {
  const response = await view(request({}, "POST", { cookie }), params);
  expect(response.status).toBe(204);
  expect(response.headers.getSetCookie()).toEqual([]);
  expect(quota).not.toHaveBeenCalled();
  expect(recordView).not.toHaveBeenCalled();
});
