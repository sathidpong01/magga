import { sql } from "drizzle-orm";
import {
  pgSchema,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
  index,
  primaryKey,
  unique,
  check,
  foreignKey,
} from "drizzle-orm/pg-core";

const privateSchema = pgSchema("private");
const time = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "date" });

export const polls = privateSchema
  .table(
    "polls",
    {
      id: uuid().defaultRandom().primaryKey(),
      title: text().notNull(),
      description: text().default("").notNull(),
      creatorId: text("creator_id").notNull(),
      coverAssetId: uuid("cover_asset_id").references(() => pollAssets.id),
      status: text().default("draft").notNull(),
      visibility: text().default("public").notNull(),
      resultsVisibility: text("results_visibility")
        .default("after_vote")
        .notNull(),
      security: text().default("standard").notNull(),
      requireCaptcha: boolean("require_captcha").default(true).notNull(),
      minChoices: integer("min_choices").default(1).notNull(),
      maxChoices: integer("max_choices").default(1).notNull(),
      allowChange: boolean("allow_change").default(false).notNull(),
      showCount: boolean("show_count").default(true).notNull(),
      showOnHome: boolean("show_on_home").default(true).notNull(),
      pinned: boolean().default(false).notNull(),
      startsAt: time("starts_at").notNull(),
      endsAt: time("ends_at").notNull(),
      publishedAt: time("published_at"),
      version: integer().default(1).notNull(),
      createdAt: time("created_at").defaultNow().notNull(),
      updatedAt: time("updated_at").defaultNow().notNull(),
    },
    (t) => [
      check(
        "poll_status_check",
        sql`${t.status} IN ('draft','published','paused','closed','archived')`,
      ),
      check(
        "poll_visibility_check",
        sql`${t.visibility} IN ('public','unlisted')`,
      ),
      check(
        "poll_results_check",
        sql`${t.resultsVisibility} IN ('public','after_vote','after_close','admin')`,
      ),
      check(
        "poll_security_check",
        sql`${t.security} IN ('standard','ip','members')`,
      ),
      check(
        "poll_choices_check",
        sql`${t.minChoices} >= 1 AND ${t.maxChoices} >= ${t.minChoices} AND ${t.maxChoices} <= 30`,
      ),
      check("poll_time_check", sql`${t.endsAt} > ${t.startsAt}`),
      index("poll_home_idx").on(
        t.status,
        t.visibility,
        t.showOnHome,
        t.startsAt,
        t.endsAt,
      ),
    ],
  )
  .enableRLS();

export const pollAssets = privateSchema
  .table(
    "poll_assets",
    {
      id: uuid().defaultRandom().primaryKey(),
      creatorId: text("creator_id").notNull(),
      objectKey: text("object_key").notNull().unique(),
      url: text().notNull(),
      bytes: integer().notNull(),
      width: integer().notNull(),
      height: integer().notNull(),
      state: text().default("staged").notNull(),
      expiresAt: time("expires_at").notNull(),
      createdAt: time("created_at").defaultNow().notNull(),
    },
    (t) => [
      check(
        "poll_asset_state_check",
        sql`${t.state} IN ('staged','published','retired')`,
      ),
      index("poll_assets_cleanup_idx").on(t.state, t.expiresAt),
    ],
  )
  .enableRLS();

export const pollOptions = privateSchema
  .table(
    "poll_options",
    {
      id: uuid().defaultRandom().primaryKey(),
      pollId: uuid("poll_id")
        .notNull()
        .references(() => polls.id, { onDelete: "cascade" }),
      label: text().notNull(),
      position: integer().notNull(),
      assetId: uuid("asset_id").references(() => pollAssets.id),
      mangaId: uuid("manga_id"),
    },
    (t) => [
      unique("poll_options_poll_id_id_key").on(t.pollId, t.id),
      index("poll_options_order_idx").on(t.pollId, t.position),
    ],
  )
  .enableRLS();

export const pollSessions = privateSchema
  .table(
    "poll_sessions",
    {
      tokenHash: text("token_hash").primaryKey(),
      expiresAt: time("expires_at").notNull(),
      createdAt: time("created_at").defaultNow().notNull(),
    },
    (t) => [index("poll_sessions_expiry_idx").on(t.expiresAt)],
  )
  .enableRLS();

export const pollBallots = privateSchema
  .table(
    "poll_ballots",
    {
      id: uuid().defaultRandom().primaryKey(),
      pollId: uuid("poll_id")
        .notNull()
        .references(() => polls.id),
      status: text().default("counted").notNull(),
      createdAt: time("created_at").defaultNow().notNull(),
      updatedAt: time("updated_at").defaultNow().notNull(),
    },
    (t) => [
      unique("poll_ballots_id_poll_id_key").on(t.id, t.pollId),
      check(
        "poll_ballot_status_check",
        sql`${t.status} IN ('counted','excluded')`,
      ),
      index("poll_ballots_poll_idx").on(t.pollId, t.status, t.createdAt),
    ],
  )
  .enableRLS();

export const pollBallotChoices = privateSchema
  .table(
    "poll_ballot_choices",
    {
      ballotId: uuid("ballot_id").notNull(),
      pollId: uuid("poll_id").notNull(),
      optionId: uuid("option_id").notNull(),
    },
    (t) => [
      primaryKey({ columns: [t.ballotId, t.optionId] }),
      foreignKey({
        columns: [t.ballotId, t.pollId],
        foreignColumns: [pollBallots.id, pollBallots.pollId],
      }).onDelete("cascade"),
      foreignKey({
        columns: [t.pollId, t.optionId],
        foreignColumns: [pollOptions.pollId, pollOptions.id],
      }),
      index("poll_choices_option_idx").on(t.pollId, t.optionId),
    ],
  )
  .enableRLS();

export const pollClaims = privateSchema
  .table(
    "poll_claims",
    {
      pollId: uuid("poll_id").notNull(),
      claim: text().notNull(),
      ballotId: uuid("ballot_id").notNull(),
    },
    (t) => [
      primaryKey({ columns: [t.pollId, t.claim] }),
      foreignKey({
        columns: [t.ballotId, t.pollId],
        foreignColumns: [pollBallots.id, pollBallots.pollId],
      }).onDelete("cascade"),
    ],
  )
  .enableRLS();

export const pollRequests = privateSchema
  .table(
    "poll_requests",
    {
      pollId: uuid("poll_id").notNull(),
      actor: text().notNull(),
      requestId: uuid("request_id").notNull(),
      payload: text().notNull(),
      ballotId: uuid("ballot_id")
        .notNull()
        .references(() => pollBallots.id),
      createdAt: time("created_at").defaultNow().notNull(),
    },
    (t) => [primaryKey({ columns: [t.pollId, t.actor, t.requestId] })],
  )
  .enableRLS();

export const pollAuditEvents = privateSchema
  .table(
    "poll_audit_events",
    {
      id: uuid().defaultRandom().primaryKey(),
      pollId: uuid("poll_id")
        .notNull()
        .references(() => polls.id),
      actorId: text("actor_id").notNull(),
      action: text().notNull(),
      reason: text().default("").notNull(),
      createdAt: time("created_at").defaultNow().notNull(),
    },
    (t) => [index("poll_audit_poll_idx").on(t.pollId, t.createdAt)],
  )
  .enableRLS();

export const pollLimits = privateSchema
  .table(
    "poll_limits",
    {
      key: text().primaryKey(),
      count: integer().notNull(),
      expiresAt: time("expires_at").notNull(),
    },
    (t) => [index("poll_limits_expiry_idx").on(t.expiresAt)],
  )
  .enableRLS();

export const pollSecurityCounts = privateSchema
  .table(
    "poll_security_counts",
    {
      pollId: uuid("poll_id")
        .notNull()
        .references(() => polls.id),
      hour: time("hour").notNull(),
      reason: text().notNull(),
      count: integer().default(1).notNull(),
    },
    (t) => [primaryKey({ columns: [t.pollId, t.hour, t.reason] })],
  )
  .enableRLS();
