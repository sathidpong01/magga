import { afterAll, beforeEach, describe, expect, it, jest, mock } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { getTableConfig } from "drizzle-orm/pg-core";
import { profiles, accounts } from "../db/schema";
import bcrypt from "bcryptjs";
const pg = new PGlite();
const database = drizzle(pg, { schema: { profiles, accounts } });
let session = { user: { id: "fixture-user", email: "fixture@example.invalid", banned: false, isBanned: false } };
const getSession = jest.fn(async (_input: { query: { disableCookieCache: boolean } }) => session);
const changePassword = jest.fn(async (_input: unknown) => new Response(null, { status: 200 }));
const setPassword = jest.fn(async (_input: unknown) => new Response(null, { status: 200 }));
mock.module("@/db", () => ({ db: database }));
mock.module("@/lib/auth", () => ({ auth: { api: { getSession, changePassword, setPassword } } }));
mock.module("@/lib/rate-limit", () => ({ checkRateLimit: async () => ({ allowed: true }) }));
const { PUT } = await import("../app/api/user/password/route");
for (const table of [profiles, accounts]) {
  const config = getTableConfig(table);
  await pg.exec(`CREATE TABLE "${config.name}" (${config.columns.map(column => `"${column.name}" ${column.getSQLType()}`).join(",")})`);
}
const legacyHash = await bcrypt.hash("LegacyPassword1", 4);
afterAll(() => pg.close());
beforeEach(async () => {
  await pg.exec("DELETE FROM accounts; DELETE FROM profiles; INSERT INTO profiles(id,name,email,password,banned,is_banned) VALUES('fixture-user','Fixture','fixture@example.invalid',null,false,false)");
  session = { user: { id: "fixture-user", email: "fixture@example.invalid", banned: false, isBanned: false } };
  getSession.mockClear(); changePassword.mockClear(); setPassword.mockClear();
  changePassword.mockImplementation(async () => new Response(null, { status: 200 }));
  setPassword.mockImplementation(async () => new Response(null, { status: 200 }));
});
function request(currentPassword?: string) {
  return new Request("http://localhost/api/user/password", { method: "PUT", headers: { "Content-Type": "application/json", Cookie: "fixture-session=synthetic" }, body: JSON.stringify({ currentPassword, newPassword: "UpdatedPassword2" }) });
}
async function credential() {
  await pg.exec("INSERT INTO accounts(id,user_id,provider_id,password) VALUES('fixture-account','fixture-user','credential','fixture-provider-hash')");
}
async function legacy() {
  await pg.query("UPDATE profiles SET password=$1 WHERE id='fixture-user'", [legacyHash]);
}
describe("password provider response and legacy verification", () => {
  it("forwards every Set-Cookie on credential password change", async () => {
    await credential();
    const providerHeaders = new Headers();
    providerHeaders.append("Set-Cookie", "fixture-session=rotated; HttpOnly; Path=/");
    providerHeaders.append("Set-Cookie", "fixture-session-cache=rotated-cache; HttpOnly; Path=/");
    changePassword.mockResolvedValue(new Response(null, { status: 200, headers: providerHeaders }));
    const response = await PUT(request("CurrentPassword1"));
    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie()).toEqual(providerHeaders.getSetCookie());
    expect(changePassword).toHaveBeenCalledWith(expect.objectContaining({ asResponse: true, body: { currentPassword: "CurrentPassword1", newPassword: "UpdatedPassword2", revokeOtherSessions: true } }));
    expect(getSession.mock.calls.at(-1)?.[0]?.query.disableCookieCache).toBe(true);
  });
  it("returns the provider error status, body and headers unchanged", async () => {
    await credential();
    const providerError = Response.json({ code: "INVALID_PASSWORD", message: "Fixture rejection" }, { status: 400, headers: { "X-Fixture": "provider", "Set-Cookie": "fixture-expired=; Max-Age=0" } });
    changePassword.mockResolvedValue(providerError);
    const response = await PUT(request("WrongPassword1"));
    expect(response).toBe(providerError); expect(response.status).toBe(400);
    expect(response.headers.get("X-Fixture")).toBe("provider");
    expect(await response.json()).toEqual({ code: "INVALID_PASSWORD", message: "Fixture rejection" });
  });
  it("requires currentPassword for an existing credential", async () => {
    await credential();
    const response = await PUT(request());
    expect(response.status).toBe(400); expect(changePassword).not.toHaveBeenCalled();
  });
  it("rejects missing or incorrect legacy currentPassword before linking", async () => {
    await legacy();
    expect((await PUT(request())).status).toBe(400);
    const response = await PUT(request("WrongPassword1"));
    expect(response.status).toBe(400); expect((await response.json()).error).toBe("Incorrect current password");
    expect(setPassword).not.toHaveBeenCalled();
  });
  it("verifies the legacy bcrypt hash and forwards setPassword cookies", async () => {
    await legacy();
    setPassword.mockResolvedValue(new Response(null, { status: 200, headers: { "Set-Cookie": "fixture-session=new-credential; HttpOnly" } }));
    const response = await PUT(request("LegacyPassword1"));
    expect(response.status).toBe(200); expect(setPassword).toHaveBeenCalledWith(expect.objectContaining({ asResponse: true, body: { newPassword: "UpdatedPassword2" } }));
    expect(response.headers.getSetCookie()).toEqual(["fixture-session=new-credential; HttpOnly"]);
  });
  it("allows OAuth-only users to set the first password and forwards errors", async () => {
    const error = Response.json({ code: "FIXTURE_REJECTION" }, { status: 409 });
    setPassword.mockResolvedValue(error);
    expect(await PUT(request())).toBe(error); expect(changePassword).not.toHaveBeenCalled();
  });
  it("rejects the legacy ban flag even when banned is false", async () => {
    session.user.isBanned = true;
    expect((await PUT(request())).status).toBe(403);
    expect(setPassword).not.toHaveBeenCalled(); expect(changePassword).not.toHaveBeenCalled();
  });
});
