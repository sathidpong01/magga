import { sql } from 'drizzle-orm';
import { pgSchema, uuid, text, timestamp, boolean, integer, bigint, index, check, uniqueIndex } from 'drizzle-orm/pg-core';
import { profiles, comments } from './schema';

const privateSchema = pgSchema('private');
const date = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const commentGuests = privateSchema.table('comment_guests', {
  id: uuid().defaultRandom().primaryKey(),
  publicCode: text('public_code').notNull().unique(),
  name: text().notNull(),
  isBanned: boolean('is_banned').default(false).notNull(),
  banReason: text('ban_reason'),
  createdAt: date('created_at').defaultNow().notNull(),
  updatedAt: date('updated_at').defaultNow().notNull(),
}).enableRLS();

export const commentGuestSessions = privateSchema.table('comment_guest_sessions', {
  id: uuid().defaultRandom().primaryKey(),
  guestId: uuid('guest_id').notNull().references(() => commentGuests.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: date('expires_at').notNull(),
  revokedAt: date('revoked_at'),
  verifiedUntil: date('verified_until'),
  createdAt: date('created_at').defaultNow().notNull(),
}, t => [index('comment_guest_sessions_guest_idx').on(t.guestId), index('comment_guest_sessions_expiry_idx').on(t.expiresAt), check('comment_guest_sessions_hash_check', sql`${t.tokenHash} ~ '^[a-f0-9]{64}$'`)]).enableRLS();

export const commentRateLimits = privateSchema.table('comment_rate_limits', {
  key: text().primaryKey(),
  windowStart: date('window_start').notNull(),
  count: integer().default(0).notNull(),
  bytes: bigint({ mode: 'number' }).default(0).notNull(),
  expiresAt: date('expires_at').notNull(),
}, t => [index('comment_rate_limits_expiry_idx').on(t.expiresAt), check('comment_rate_limits_nonnegative', sql`${t.count} >= 0 AND ${t.bytes} >= 0`)]).enableRLS();

export const commentAssets = privateSchema.table('comment_assets', {
  id: uuid().defaultRandom().primaryKey(),
  userId: text('user_id').references(() => profiles.id),
  guestId: uuid('guest_id').references(() => commentGuests.id),
  objectKey: text('object_key').notNull().unique(),
  contentType: text('content_type').notNull(),
  bytes: bigint({ mode: 'number' }).notNull(),
  width: integer().notNull(),
  height: integer().notNull(),
  state: text({ enum: ['staged', 'reserved', 'published', 'deleted'] }).default('staged').notNull(),
  expiresAt: date('expires_at').notNull(),
  commentId: uuid('comment_id').references(() => comments.id, { onDelete: 'set null' }),
  createdAt: date('created_at').defaultNow().notNull(),
  updatedAt: date('updated_at').defaultNow().notNull(),
}, t => [check('comment_assets_owner_check', sql`num_nonnulls(${t.userId}, ${t.guestId}) = 1`), check('comment_assets_state_check', sql`${t.state} IN ('staged','reserved','published','deleted')`), check('comment_assets_dimensions_check', sql`${t.width} > 0 AND ${t.height} > 0 AND ${t.bytes} > 0`), index('comment_assets_owner_guest_idx').on(t.guestId, t.state), index('comment_assets_owner_user_idx').on(t.userId, t.state), index('comment_assets_comment_idx').on(t.commentId), index('comment_assets_expiry_idx').on(t.expiresAt)]).enableRLS();

export const commentReports = privateSchema.table('comment_reports', {
  id: uuid().defaultRandom().primaryKey(),
  commentId: uuid('comment_id').notNull().references(() => comments.id),
  userId: text('user_id').references(() => profiles.id),
  guestId: uuid('guest_id').references(() => commentGuests.id),
  reason: text({ enum: ['spam', 'abuse', 'image', 'other'] }).notNull(),
  details: text(),
  status: text({ enum: ['open', 'resolved', 'dismissed'] }).default('open').notNull(),
  reviewerUserId: text('reviewer_user_id').references(() => profiles.id),
  createdAt: date('created_at').defaultNow().notNull(),
  updatedAt: date('updated_at').defaultNow().notNull(),
}, t => [check('comment_reports_owner_check', sql`num_nonnulls(${t.userId}, ${t.guestId}) = 1`), check('comment_reports_reason_check', sql`${t.reason} IN ('spam','abuse','image','other')`), check('comment_reports_status_check', sql`${t.status} IN ('open','resolved','dismissed')`), uniqueIndex('comment_reports_member_unique').on(t.commentId, t.userId).where(sql`${t.userId} IS NOT NULL`), uniqueIndex('comment_reports_guest_unique').on(t.commentId, t.guestId).where(sql`${t.guestId} IS NOT NULL`), index('comment_reports_status_idx').on(t.status, t.createdAt)]).enableRLS();

export const commentModerationEvents = privateSchema.table('comment_moderation_events', {
  id: uuid().defaultRandom().primaryKey(),
  actorUserId: text('actor_user_id').notNull().references(() => profiles.id),
  commentId: uuid('comment_id').references(() => comments.id),
  guestId: uuid('guest_id').references(() => commentGuests.id),
  reportId: uuid('report_id').references(() => commentReports.id),
  action: text().notNull(),
  reason: text(),
  createdAt: date('created_at').defaultNow().notNull(),
}, t => [index('comment_moderation_events_comment_idx').on(t.commentId), check('comment_moderation_events_action_check', sql`${t.action} IN ('hide','publish','delete','ban-guest','unban-guest','resolve-report','dismiss-report')`)]).enableRLS();
