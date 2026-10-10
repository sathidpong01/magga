import { afterAll, describe, expect, it, mock } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../db/schema";
const pg = new PGlite();
const database = drizzle(pg, { schema });
mock.module("@/db", () => ({ db: database }));
const { createSubmission, submissionDayStart, submissionSchema, SubmissionQuotaError } = await import("../lib/submissions");
await pg.exec(`
CREATE TABLE manga (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, slug text);
CREATE TABLE tags (id uuid PRIMARY KEY);
CREATE TABLE user_submission_limits (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, user_id text UNIQUE NOT NULL, submission_count int NOT NULL DEFAULT 0, window_start timestamptz NOT NULL DEFAULT now(), last_submit_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE manga_submissions (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, user_id text NOT NULL, title text NOT NULL, slug text, description text, cover_image text NOT NULL, pages text NOT NULL, category_id uuid, author_id uuid, extra_metadata text, status text NOT NULL DEFAULT 'PENDING', submitted_at timestamptz DEFAULT now(), reviewed_at timestamptz, reviewed_by text, review_note text, rejection_reason text, approved_manga_id uuid, updated_at timestamptz DEFAULT now());
CREATE TABLE manga_submission_tags (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, submission_id uuid REFERENCES manga_submissions(id), tag_id uuid REFERENCES tags(id), UNIQUE(submission_id,tag_id));
`);
afterAll(() => pg.close());
const input = submissionSchema.parse({ title: "Quota fixture", coverImage: "https://example.org/cover.png", pages: ["https://example.org/page.png"] });
describe("transactional submissions", () => {
  it("uses midnight Bangkok across the UTC date boundary", () => {
    expect(submissionDayStart(new Date("2026-10-09T16:59:59Z"))).toBe("2026-10-08T17:00:00.000Z");
    expect(submissionDayStart(new Date("2026-10-09T17:00:00Z"))).toBe("2026-10-09T17:00:00.000Z");
  });
  it("dedupes valid tags and rejects malformed UUIDs", () => {
    const tag = "11111111-1111-4111-8111-111111111111";
    expect(submissionSchema.parse({ ...input, tagIds: [tag, tag] }).tagIds).toEqual([tag]);
    expect(submissionSchema.safeParse({ ...input, tagIds: ["not-an-id"] }).success).toBe(false);
  });
  it("rolls back the record and consumed quota when a tag FK fails", async () => {
    await expect(createSubmission("rollback-user", { ...input, tagIds: ["11111111-1111-4111-8111-111111111111"] })).rejects.toThrow();
    const result = await pg.query<{ count: number }>("SELECT count(*)::int AS count FROM user_submission_limits WHERE user_id='rollback-user'");
    expect(result.rows[0].count).toBe(0);
    expect((await pg.query<{ count: number }>("SELECT count(*)::int AS count FROM manga_submissions WHERE user_id='rollback-user'")).rows[0].count).toBe(0);
  });
  it("allows only one of two callers when the counter is already four", async () => {
    for (let n = 0; n < 4; n++) await createSubmission("near-limit-user", input);
    const outcomes = await Promise.allSettled([createSubmission("near-limit-user", input), createSubmission("near-limit-user", input)]);
    expect(outcomes.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter(result => result.status === "rejected")).toHaveLength(1);
    expect((await pg.query<{ submission_count: number }>("SELECT submission_count FROM user_submission_limits WHERE user_id='near-limit-user'")).rows[0].submission_count).toBe(5);
  });
  it("accepts five and rejects the sixth; resets yesterday's quota", async () => {
    for (let n = 0; n < 5; n++) await createSubmission("quota-user", input);
    await expect(createSubmission("quota-user", input)).rejects.toBeInstanceOf(SubmissionQuotaError);
    expect((await pg.query<{ submission_count: number }>("SELECT submission_count FROM user_submission_limits WHERE user_id='quota-user'")).rows[0].submission_count).toBe(5);
    await pg.exec("UPDATE user_submission_limits SET window_start=now()-interval '2 days' WHERE user_id='quota-user'");
    await createSubmission("quota-user", input);
    expect((await pg.query<{ submission_count: number }>("SELECT submission_count FROM user_submission_limits WHERE user_id='quota-user'")).rows[0].submission_count).toBe(1);
  });
});
