import { afterAll, beforeAll, beforeEach, expect, it } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { randomUUID } from "node:crypto";
import type { PollDatabase } from "@/lib/polls/database";
import {
  createPoll,
  duplicatePoll,
  getAdminPoll,
  getPublicPoll,
  listPolls,
  moderateBallot,
  pollActivity,
  recordPollRejection,
  transitionPoll,
  updatePoll,
  vote,
  type Voter,
} from "@/lib/polls/service";
import { parsePollInput, parseVote, csvCell } from "@/lib/polls/validation";
import { fromBangkokInput, toBangkokInput } from "@/lib/polls/time";
import type { AdminPoll, PollInput } from "@/lib/polls/types";
import { cleanupPolls } from "@/lib/polls/cleanup";
import { MemoryStorageAdapter } from "@/lib/storage/adapters/memory";

const pg = new PGlite();
const database: PollDatabase = {
  async query<T>(text: string, parameters?: unknown[]) {
    return (await pg.query<T>(text, parameters)).rows;
  },
  transaction: (work) =>
    pg.transaction((tx) =>
      work({
        async query<T>(text: string, parameters?: unknown[]) {
          return (await tx.query<T>(text, parameters)).rows;
        },
      }),
    ),
};
const admin = "test-admin";
const voter = (
  guestHash: string = randomUUID(),
  network = "shared-network",
  userId: string | null = null,
): Voter => ({
  guestHash,
  userId,
  network,
  secret: "synthetic-poll-abuse-test-secret",
});
let challengeCalls = 0;
const verify = async () => {
  challengeCalls++;
};
function input(overrides: Partial<PollInput> = {}): PollInput {
  return {
    title: "อยากอ่านเรื่องไหนต่อ",
    description: "เลือกเรื่องที่อยากให้แปล",
    coverAssetId: null,
    visibility: "public",
    resultsVisibility: "after_vote",
    security: "standard",
    minChoices: 1,
    maxChoices: 1,
    allowChange: false,
    showCount: false,
    showOnHome: true,
    pinned: false,
    startsAt: new Date(Date.now() - 60000).toISOString(),
    endsAt: new Date(Date.now() + 86400000).toISOString(),
    options: [
      { id: randomUUID(), label: "เรื่องหนึ่ง", assetId: null, mangaId: null },
      { id: randomUUID(), label: "เรื่องสอง", assetId: null, mangaId: null },
    ],
    ...overrides,
  };
}
async function published(overrides: Partial<PollInput> = {}) {
  const poll = await createPoll(database, admin, input(overrides));
  return transitionPoll(database, poll.id, admin, "publish", poll.version);
}
const cast = (
  poll: AdminPoll,
  actor: Voter,
  choices = [poll.options[0].id],
  requestId = randomUUID(),
) => vote(database, poll.id, actor, { choices, requestId }, verify);
beforeAll(async () => {
  await pg.exec(
    "CREATE ROLE anon; CREATE ROLE authenticated; CREATE TABLE public.manga(id uuid PRIMARY KEY,title text,cover_image text,is_hidden boolean DEFAULT false);",
  );
  await pg.exec(
    await Bun.file(
      new URL("../db/migrations/0019_community_polls.sql", import.meta.url),
    ).text(),
  );
}, 30000);
beforeEach(async () => {
  challengeCalls = 0;
  await pg.exec(
    "TRUNCATE private.polls,private.poll_assets,private.poll_sessions,private.poll_limits CASCADE; TRUNCATE public.manga;",
  );
});
afterAll(() => pg.close());

it("keeps drafts, future, unlisted, paused, closed and opted-out polls off the homepage", async () => {
  const draft = await createPoll(database, admin, input());
  await expect(getPublicPoll(database, draft.id)).rejects.toThrow("ไม่พบโพล");
  expect(await listPolls(database, false, true)).toEqual([]);
  await published({ startsAt: new Date(Date.now() + 3600000).toISOString() });
  await published({ visibility: "unlisted" });
  await published({ showOnHome: false });
  const paused = await published();
  await transitionPoll(database, paused.id, admin, "pause", paused.version);
  const closed = await published();
  await transitionPoll(database, closed.id, admin, "close", closed.version);
  expect(await listPolls(database, false, true)).toEqual([]);
  const visible = await published();
  expect((await listPolls(database, false, true)).map((p) => p.id)).toEqual([
    visible.id,
  ]);
  const pinned = await published({ pinned: true });
  expect((await listPolls(database, false, true))[0].id).toBe(pinned.id);
});
it("does not serialize restricted option counts, totals or private identities", async () => {
  const poll = await published();
  await cast(poll, voter());
  const publicPoll = await getPublicPoll(database, poll.id);
  expect(publicPoll.total).toBeNull();
  expect(publicPoll.resultsAllowed).toBe(false);
  expect(publicPoll.options.every((o) => !("votes" in o))).toBe(true);
  expect(JSON.stringify(publicPoll)).not.toContain("creatorId");
  expect((await getAdminPoll(database, poll.id)).total).toBe(1);
});
it("acknowledges a lost response without rechecking CAPTCHA or adding another ballot, even after closing", async () => {
  const poll = await published();
  const actor = voter();
  const request = randomUUID();
  await cast(poll, actor, undefined, request);
  await transitionPoll(database, poll.id, admin, "close", poll.version);
  expect((await cast(poll, actor, undefined, request)).replayed).toBe(true);
  expect(challengeCalls).toBe(1);
  expect((await getAdminPoll(database, poll.id)).total).toBe(1);
  await expect(
    cast(poll, actor, [poll.options[1].id], request),
  ).rejects.toThrow("คำตอบอื่น");
});
it("rejects another request from the same identity and accepts different guests on the same Wi-Fi in standard mode", async () => {
  const poll = await published();
  const actor = voter();
  await cast(poll, actor);
  await expect(cast(poll, actor)).rejects.toThrow("โหวตในโพลนี้แล้ว");
  await cast(poll, voter());
  expect((await getAdminPoll(database, poll.id)).total).toBe(2);
});
it("accepts one ballot when the same voter submits competing requests concurrently", async () => {
  const poll = await published();
  const actor = voter();
  const results = await Promise.allSettled(
    Array.from({ length: 15 }, () => cast(poll, actor)),
  );
  expect(results.filter((result) => result.status === "fulfilled").length).toBe(
    1,
  );
  const counted = await getAdminPoll(database, poll.id);
  expect(counted.total).toBe(1);
  expect(counted.options[0].votes).toBe(1);
});
it("filters administrative states and orders by count without interpolating caller sort text", async () => {
  const draft = await createPoll(database, admin, input());
  const open = await published();
  await cast(open, voter());
  expect(
    (await listPolls(database, true, false, "", 1, "draft")).map((p) => p.id),
  ).toEqual([draft.id]);
  expect(
    (await listPolls(database, true, false, "", 1, "open", "votes"))[0].id,
  ).toBe(open.id);
  expect(
    (await listPolls(database, true, false, "", 1, "' OR true --")).length,
  ).toBe(0);
});
it("limits strict-IP voting without allowing a different guest to edit the first guest's ballot", async () => {
  const poll = await published({ security: "ip", allowChange: true });
  await cast(poll, voter());
  await expect(cast(poll, voter(), [poll.options[1].id])).rejects.toThrow(
    "ใช้สิทธิ์โหวตแล้ว",
  );
  expect(
    (await getAdminPoll(database, poll.id)).options.map((o) => o.votes),
  ).toEqual([1, 0]);
});
it("links guest and member claims and does not grant a second ballot after login or a new member session", async () => {
  const poll = await published();
  const guest = voter("guest-one");
  await cast(poll, guest);
  await expect(cast(poll, { ...guest, userId: "member-one" })).rejects.toThrow(
    "โหวตในโพลนี้แล้ว",
  );
  await expect(
    cast(poll, voter("new-browser", "other-network", "member-one")),
  ).rejects.toThrow("โหวตในโพลนี้แล้ว");
  // In change-enabled polls a verified login attaches the account claim to the existing ballot.
  const editable = await published({ allowChange: true });
  await cast(editable, guest);
  await cast(editable, { ...guest, userId: "member-one" }, [
    editable.options[1].id,
  ]);
  expect(
    (
      await getPublicPoll(
        database,
        editable.id,
        voter("new-session", "other-network", "member-one"),
      )
    ).hasVoted,
  ).toBe(true);
  expect((await getAdminPoll(database, editable.id)).total).toBe(1);
});
it("changes multi-choice selections atomically and derives percentages from ballots", async () => {
  const poll = await published({ maxChoices: 2, allowChange: true });
  const actor = voter();
  await cast(
    poll,
    actor,
    poll.options.map((o) => o.id),
  );
  let result = await getPublicPoll(database, poll.id, actor);
  expect(result.total).toBe(1);
  expect(result.options.map((o) => o.votes)).toEqual([1, 1]);
  await cast(poll, actor, [poll.options[1].id]);
  result = await getPublicPoll(database, poll.id, actor);
  expect(result.total).toBe(1);
  expect(result.options.map((o) => o.votes)).toEqual([0, 1]);
});
it("rejects cross-poll options, repeated choices, over-selection and failed challenges without partial writes", async () => {
  const poll = await published();
  const other = await published();
  const actor = voter();
  for (const choices of [
    [other.options[0].id],
    [poll.options[0].id, poll.options[0].id],
    poll.options.map((o) => o.id),
  ])
    await expect(cast(poll, actor, choices)).rejects.toThrow("กรุณาเลือกคำตอบ");
  await expect(
    vote(
      database,
      poll.id,
      actor,
      { requestId: randomUUID(), choices: [poll.options[0].id] },
      async () => {
        throw new Error("challenge unavailable");
      },
    ),
  ).rejects.toThrow("challenge unavailable");
  expect((await getAdminPoll(database, poll.id)).total).toBe(0);
});
it("checks the database deadline after obtaining the lock and never relies on cron", async () => {
  const poll = await published();
  await database.query(
    "UPDATE private.polls SET starts_at=clock_timestamp()-interval '2 days',ends_at=clock_timestamp()-interval '1 day' WHERE id=$1",
    [poll.id],
  );
  await expect(cast(poll, voter())).rejects.toThrow("ปิดรับโหวตแล้ว");
  expect(await listPolls(database, false, true)).toEqual([]);
  expect((await getPublicPoll(database, poll.id)).state).toBe("closed");
});
it("validates edits against the current version and freezes meaning after the first ballot", async () => {
  const original = input();
  const draft = await createPoll(database, admin, original);
  const updated = await updatePoll(
    database,
    draft.id,
    admin,
    { ...original, description: "คำอธิบายใหม่" },
    draft.version,
  );
  await expect(
    updatePoll(database, draft.id, admin, original, draft.version),
  ).rejects.toThrow("หน้าต่างอื่น");
  const poll = await transitionPoll(
    database,
    draft.id,
    admin,
    "publish",
    updated.version,
  );
  await cast(poll, voter());
  await expect(
    updatePoll(
      database,
      poll.id,
      admin,
      { ...original, title: "เปลี่ยนคำถาม" },
      poll.version,
    ),
  ).rejects.toThrow("กติกาไม่ได้");
  expect(
    (
      await updatePoll(
        database,
        poll.id,
        admin,
        { ...original, description: "อธิบายเพิ่ม" },
        poll.version,
      )
    ).description,
  ).toBe("อธิบายเพิ่ม");
});
it("enforces member-only access and each results visibility mode server-side", async () => {
  const poll = await published({
    security: "members",
    resultsVisibility: "after_close",
  });
  await expect(cast(poll, voter())).rejects.toThrow("สมาชิก");
  const member = voter("guest", "network", "member");
  await cast(poll, member);
  expect((await getPublicPoll(database, poll.id, member)).resultsAllowed).toBe(
    false,
  );
  await transitionPoll(database, poll.id, admin, "close", poll.version);
  expect((await getPublicPoll(database, poll.id)).options[0].votes).toBe(1);
  const privatePoll = await published({ resultsVisibility: "admin" });
  await cast(privatePoll, member);
  expect(
    (await getPublicPoll(database, privatePoll.id, member)).resultsAllowed,
  ).toBe(false);
});
it("audits exclusion and restoration while retaining duplicate-vote claims", async () => {
  const poll = await published();
  const actor = voter();
  const ballot = await cast(poll, actor);
  await expect(
    moderateBallot(database, poll.id, ballot.ballotId, admin, true, ""),
  ).rejects.toThrow("เหตุผล");
  await moderateBallot(
    database,
    poll.id,
    ballot.ballotId,
    admin,
    true,
    "ทดสอบการตรวจบัตร",
  );
  expect((await getAdminPoll(database, poll.id)).total).toBe(0);
  await expect(cast(poll, actor)).rejects.toThrow("ถูกระงับ");
  await moderateBallot(
    database,
    poll.id,
    ballot.ballotId,
    admin,
    false,
    "คืนหลังตรวจสอบ",
  );
  expect((await getAdminPoll(database, poll.id)).total).toBe(1);
  expect(
    (
      await database.query(
        "SELECT id FROM private.poll_audit_events WHERE action IN ('exclude-ballot','restore-ballot')",
      )
    ).length,
  ).toBe(2);
});
it("validates asset ownership and retains referenced images while cleaning abandoned uploads", async () => {
  const storage = new MemoryStorageAdapter("https://cdn.example/assets");
  const asset = async (owner: string, key: string) => {
    await storage.put(key, new Uint8Array([1]), "image/webp");
    const [row] = await database.query<{ id: string }>(
      "INSERT INTO private.poll_assets(creator_id,object_key,url,bytes,width,height,expires_at) VALUES($1,$2,$3,1,3,4,clock_timestamp()+interval '1 day') RETURNING id",
      [owner, key, storage.getPublicUrl(key)],
    );
    return row.id;
  };
  const kept = await asset(admin, "kept.webp");
  const abandoned = await asset(admin, "abandoned.webp");
  const foreign = await asset("other", "foreign.webp");
  await expect(
    createPoll(database, admin, input({ coverAssetId: foreign })),
  ).rejects.toThrow("ไม่ใช่ไฟล์");
  await createPoll(database, admin, input({ coverAssetId: kept }));
  await database.query(
    "UPDATE private.poll_assets SET expires_at=clock_timestamp()-interval '1 day' WHERE id IN ($1,$2)",
    [kept, abandoned],
  );
  expect(await cleanupPolls(database, storage)).toBe(1);
  expect(storage.has("kept.webp")).toBe(true);
  expect(storage.has("abandoned.webp")).toBe(false);
});
it("duplicates questions and media as a fresh draft without copying votes or exposing arbitrary foreign uploads", async () => {
  const poll = await published();
  await cast(poll, voter());
  const copy = await duplicatePoll(database, poll.id, "another-admin");
  expect(copy.status).toBe("draft");
  expect(copy.total).toBe(0);
  expect(copy.options.map((o) => o.id)).not.toEqual(
    poll.options.map((o) => o.id),
  );
  expect(copy.options.map((o) => o.label)).toEqual(
    poll.options.map((o) => o.label),
  );
});
it("aggregates rejected requests without persisting voter identifiers and ignores unknown poll IDs", async () => {
  const poll = await published();
  await recordPollRejection(database, poll.id, "verification");
  await recordPollRejection(database, poll.id, "verification");
  await recordPollRejection(database, randomUUID(), "duplicate");
  const activity = await pollActivity(database, poll.id);
  expect(activity.security).toEqual([{ reason: "verification", count: 2 }]);
});
it("rejects hidden manga at attachment time and never accepts arbitrary image URLs", async () => {
  const id = randomUUID();
  await database.query(
    "INSERT INTO public.manga(id,title,cover_image,is_hidden) VALUES($1,'hidden','https://cdn.example/secret.webp',true)",
    [id],
  );
  const value = input();
  value.options[0].mangaId = id;
  await expect(createPoll(database, admin, value)).rejects.toThrow(
    "เผยแพร่แล้ว",
  );
  expect(() =>
    parsePollInput({ ...input(), imageUrl: "https://attacker.example" }),
  ).toThrow();
});
it("keeps all poll tables inaccessible to the anonymous Data API role", async () => {
  await pg.exec("SET ROLE anon");
  try {
    await expect(
      pg.query("SELECT * FROM private.poll_ballots"),
    ).rejects.toThrow();
  } finally {
    await pg.exec("RESET ROLE");
  }
});
it("removes old identity links while preserving historical vote totals", async () => {
  const poll = await published();
  await cast(poll, voter());
  await database.query(
    "UPDATE private.polls SET starts_at=clock_timestamp()-interval '92 days',ends_at=clock_timestamp()-interval '91 days',updated_at=clock_timestamp()-interval '91 days' WHERE id=$1",
    [poll.id],
  );
  await cleanupPolls(database, new MemoryStorageAdapter());
  expect(await database.query("SELECT * FROM private.poll_claims")).toEqual([]);
  expect(await database.query("SELECT * FROM private.poll_requests")).toEqual(
    [],
  );
  expect((await getAdminPoll(database, poll.id)).total).toBe(1);
});
it("validates Thai scheduling, choice bounds and CSV formula escaping", () => {
  expect(toBangkokInput("2026-11-07T03:30:00Z")).toBe("2026-11-07T10:30");
  expect(fromBangkokInput("2026-11-07T10:30")).toBe("2026-11-07T03:30:00.000Z");
  expect(fromBangkokInput("2026-02-31T12:00")).toBeNull();
  expect(() =>
    parsePollInput(input({ minChoices: 2, maxChoices: 1 })),
  ).toThrow();
  expect(() =>
    parseVote({ requestId: randomUUID(), choices: ["bad"] }),
  ).toThrow();
  expect(csvCell("=cmd()")).toBe('"\'=cmd()"');
  expect(csvCell('ชื่อ"ไทย')).toBe('"ชื่อ""ไทย"');
});
