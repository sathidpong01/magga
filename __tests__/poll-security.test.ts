import { afterAll, afterEach, beforeEach, expect, it, mock } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { restoreGlobals, stubGlobal } from "./helpers/globals";
import type { PollExecutor } from "@/lib/polls/database";

const read = mock(() => {
  throw new Error("UNAUTHORIZED_DATABASE_READ");
});
const session = mock(async (): Promise<unknown> => null);
mock.module("@/db", () => ({ db: { execute: read, transaction: read } }));
mock.module("@/lib/auth", () => ({ auth: { api: { getSession: session } } }));
const {
  consumePollLimit,
  trustedNetwork,
  verifyPollChallenge,
  assertPollOrigin,
  pollVerificationKey,
} = await import("@/lib/polls/security");
const { GET: adminGet, POST: adminPost } =
  await import("@/app/api/admin/polls/route");
const pg = new PGlite();
await pg.exec(
  "CREATE SCHEMA private; CREATE TABLE private.poll_limits(key text PRIMARY KEY,count integer NOT NULL,expires_at timestamptz NOT NULL)",
);
const database: PollExecutor = {
  async query<T>(text: string, parameters?: unknown[]) {
    return (await pg.query<T>(text, parameters)).rows;
  },
};
const names = [
  "TURNSTILE_SECRET_KEY",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "VERCEL",
  "NEXT_PUBLIC_APP_URL",
  "BETTER_AUTH_URL",
];
const original = Object.fromEntries(
  names.map((key) => [key, process.env[key]]),
);
beforeEach(() => {
  read.mockClear();
  session.mockReset();
  session.mockResolvedValue(null);
  process.env.TURNSTILE_SECRET_KEY = "synthetic-test-secret";
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "synthetic-test-site";
  process.env.NEXT_PUBLIC_APP_URL = "https://magga.example";
});
afterEach(() => {
  restoreGlobals();
  for (const name of names) {
    if (original[name] === undefined) delete process.env[name];
    else process.env[name] = original[name];
  }
});
afterAll(() => pg.close());
const headers = new Headers({
  Origin: "https://magga.example",
  Host: "magga.example",
});
it("checks Turnstile success strictly and binds the action and hostname", async () => {
  const fetcher = mock(async () =>
    Response.json({
      success: true,
      action: "poll_vote",
      hostname: "magga.example",
    }),
  );
  stubGlobal("fetch", fetcher);
  await verifyPollChallenge(headers, "token");
  expect(fetcher.mock.calls.length).toBe(1);
  for (const result of [
    { success: true, action: "comment", hostname: "magga.example" },
    { success: true, action: "poll_vote", hostname: "evil.example" },
    { success: "true", action: "poll_vote", hostname: "magga.example" },
    { success: false },
  ]) {
    stubGlobal("fetch", async () => Response.json(result));
    await expect(verifyPollChallenge(headers, "token")).rejects.toThrow(
      "การยืนยันหมดอายุ",
    );
  }
});
it("fails closed when verification is missing, unavailable or malformed", async () => {
  await expect(verifyPollChallenge(headers)).rejects.toThrow("กรุณายืนยัน");
  stubGlobal("fetch", async () => {
    throw new Error("network");
  });
  await expect(verifyPollChallenge(headers, "token")).rejects.toThrow(
    "ระบบยืนยันไม่พร้อม",
  );
  stubGlobal("fetch", async () => new Response("not json"));
  await expect(verifyPollChallenge(headers, "token")).rejects.toThrow(
    "ระบบยืนยันไม่พร้อม",
  );
  delete process.env.TURNSTILE_SECRET_KEY;
  await expect(verifyPollChallenge(headers, "token")).rejects.toThrow(
    "ยังไม่พร้อม",
  );
});
it("ignores spoofed forwarded headers and requires the deployment-controlled network header", () => {
  process.env.VERCEL = "1";
  expect(() =>
    trustedNetwork(
      new Headers({ "x-forwarded-for": "1.2.3.4", "x-real-ip": "1.2.3.4" }),
    ),
  ).toThrow("ตรวจเครือข่าย");
  expect(
    trustedNetwork(
      new Headers({
        "x-vercel-forwarded-for": "203.0.113.1",
        "x-forwarded-for": "1.2.3.4",
      }),
    ),
  ).toBe("203.0.113.1");
});
it("binds verifier idempotency to the actor and token instead of replaying a caller UUID", () => {
  const voter = {
    guestHash: "guest-one",
    userId: null,
    network: "network",
    secret: "test-secret",
  };
  const first = pollVerificationKey("poll", voter, "request", "token");
  expect(first).toMatch(
    /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-a[a-f0-9]{3}-[a-f0-9]{12}$/,
  );
  expect(pollVerificationKey("poll", voter, "request", "token")).toBe(first);
  expect(
    pollVerificationKey(
      "poll",
      { ...voter, guestHash: "another-guest" },
      "request",
      "token",
    ),
  ).not.toBe(first);
  expect(pollVerificationKey("poll", voter, "request", "new-token")).not.toBe(
    first,
  );
});
it("rejects foreign origins and rejects non-admin reads before touching the database", async () => {
  expect(() =>
    assertPollOrigin(
      new Request("https://magga.example/api/polls", {
        method: "POST",
        headers: { Origin: "https://evil.example" },
      }),
    ),
  ).toThrow("แหล่งที่มา");
  expect(
    (await adminGet(new Request("https://magga.example/api/admin/polls")))
      .status,
  ).toBe(401);
  session.mockResolvedValue({ user: { id: "member", role: "user" } });
  expect(
    (await adminGet(new Request("https://magga.example/api/admin/polls")))
      .status,
  ).toBe(403);
  session.mockResolvedValue({
    user: { id: "admin", role: "admin", banned: true },
  });
  expect(
    (await adminGet(new Request("https://magga.example/api/admin/polls")))
      .status,
  ).toBe(403);
  expect(
    (
      await adminPost(
        new Request("https://magga.example/api/admin/polls", {
          method: "POST",
          headers: { Origin: "https://evil.example" },
        }),
      )
    ).status,
  ).toBe(403);
  expect(read).not.toHaveBeenCalled();
});
it("stores shared rate limits atomically, returns a retry delay, and propagates storage outages", async () => {
  const key = crypto.randomUUID();
  await consumePollLimit(database, key, 2, 30);
  await consumePollLimit(database, key, 2, 30);
  try {
    await consumePollLimit(database, key, 2, 30);
    throw new Error("Expected rate limit");
  } catch (error) {
    expect(error).toMatchObject({ status: 429 });
    expect(error).toHaveProperty("retryAfter");
  }
  await pg.query(
    "UPDATE private.poll_limits SET expires_at=clock_timestamp()-interval '1 second' WHERE key=$1",
    [key],
  );
  await consumePollLimit(database, key, 2, 30);
  await expect(
    consumePollLimit(
      {
        query: async () => {
          throw new Error("storage offline");
        },
      },
      key,
      2,
      30,
    ),
  ).rejects.toThrow("storage offline");
});
