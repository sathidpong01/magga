import { afterAll, beforeEach, describe, expect, it, jest, mock } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { NextRequest } from "next/server";
import { profiles, sessions } from "../db/schema";
const pg = new PGlite();
const db = drizzle(pg);
const getSession = jest.fn(async (_input: { query: { disableCookieCache: boolean } }) => ({ user: { id: "fixture-admin", role: "admin" } }));
mock.module("@/db", () => ({ db }));
mock.module("@/lib/auth", () => ({ auth: { api: { getSession } } }));
mock.module("next/headers", () => ({ headers: async () => new Headers() }));
const banRoute = await import("../app/api/admin/users/[id]/ban/route");
const roleRoute = await import("../app/api/admin/users/route");
await pg.exec(`
CREATE TABLE profiles(id text PRIMARY KEY, name text, email text, username text, role text NOT NULL DEFAULT 'user', banned boolean DEFAULT false, is_banned boolean DEFAULT false, ban_reason text, banned_at timestamptz, updated_at timestamptz DEFAULT now());
CREATE TABLE sessions(id text PRIMARY KEY, user_id text NOT NULL);
CREATE FUNCTION fixture_fail_revoke() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('fixture.fail_revoke', true) = 'on' THEN RAISE EXCEPTION 'fixture revoke failure'; END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER fixture_revoke_guard BEFORE DELETE ON sessions FOR EACH ROW EXECUTE FUNCTION fixture_fail_revoke();
`);
const quietErrors = jest.spyOn(console, "error").mockImplementation(() => {});
afterAll(async () => { quietErrors.mockRestore(); await pg.close(); });
beforeEach(async () => {
  await pg.exec("SET fixture.fail_revoke='off'; DELETE FROM sessions; DELETE FROM profiles; INSERT INTO profiles(id,name,email,username) VALUES('fixture-target','Fixture','fixture@example.invalid','fixture'); INSERT INTO sessions(id,user_id) VALUES('fixture-session','fixture-target');");
  getSession.mockClear();
});
function request(method: string, body?: unknown) {
  return new NextRequest("http://localhost/api/admin/users/fixture-target/ban", { method, ...(body ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } } : {}) });
}
const params = { params: Promise.resolve({ id: "fixture-target" }) };
async function state() {
  const [profile] = await db.select({ role: profiles.role, banned: profiles.banned, isBanned: profiles.isBanned, banReason: profiles.banReason }).from(profiles);
  const live = await db.select({ id: sessions.id }).from(sessions);
  return { profile, live };
}
describe("atomic privileged changes and session revocation", () => {
  it("rolls back both ban flags if revocation fails", async () => {
    await pg.exec("SET fixture.fail_revoke='on'");
    expect((await banRoute.POST(request("POST", { banReason: "Fixture reason" }), params)).status).toBe(500);
    const result = await state();
    expect(result.profile.banned).toBe(false); expect(result.profile.isBanned).toBe(false);
    expect(result.profile.banReason).toBeNull(); expect(result.live).toHaveLength(1);
    expect(getSession.mock.calls.at(-1)?.[0]?.query.disableCookieCache).toBe(true);
  });
  it("rolls back unban when revocation fails", async () => {
    await pg.exec("UPDATE profiles SET banned=true,is_banned=true,ban_reason='Fixture reason'; SET fixture.fail_revoke='on'");
    expect((await banRoute.DELETE(request("DELETE"), params)).status).toBe(500);
    const result = await state(); expect(result.profile.banned).toBe(true); expect(result.profile.isBanned).toBe(true);
    expect(result.profile.banReason).toBe("Fixture reason"); expect(result.live).toHaveLength(1);
  });
  it("rolls back role change when revocation fails", async () => {
    await pg.exec("UPDATE profiles SET role='admin'; SET fixture.fail_revoke='on'");
    expect((await roleRoute.PUT(request("PUT", { userId: "fixture-target", role: "user" }))).status).toBe(500);
    const result = await state(); expect(result.profile.role).toBe("admin"); expect(result.live).toHaveLength(1);
  });
  it("commits the ban and revokes existing sessions together", async () => {
    expect((await banRoute.POST(request("POST", { banReason: "Fixture reason" }), params)).status).toBe(200);
    const result = await state(); expect(result.profile.banned).toBe(true); expect(result.profile.isBanned).toBe(true);
    expect(result.live).toHaveLength(0);
  });
  it("commits normalized role changes and revokes existing sessions", async () => {
    expect((await roleRoute.PUT(request("PUT", { userId: "fixture-target", role: "ADMIN" }))).status).toBe(200);
    const result = await state(); expect(result.profile.role).toBe("admin"); expect(result.live).toHaveLength(0);
  });
});
