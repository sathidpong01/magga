import { pgTable, uuid, text, timestamp, integer, jsonb, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { profiles } from './schema';

export const mcpApiKeys = pgTable('mcp_api_keys', {
  id: uuid().defaultRandom().primaryKey(),
  ownerUserId: text('owner_user_id').notNull().references(() => profiles.id),
  name: text().notNull(),
  keyPrefix: text('key_prefix').notNull(),
  secretHash: text('secret_hash').notNull().unique(),
  scopes: text().array().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  windowStart: timestamp('window_start', { withTimezone: true }).defaultNow().notNull(),
  requestCount: integer('request_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  check('mcp_api_keys_secret_hash_check', sql`${t.secretHash} ~ '^[a-f0-9]{64}$'`),
  check('mcp_api_keys_scopes_check', sql`${t.scopes} <@ ARRAY['catalog:read','research:read','draft:write','metadata:write']::text[]`),
]).enableRLS();

export const mcpMetadataDrafts = pgTable('mcp_metadata_drafts', {
  id: uuid().defaultRandom().primaryKey(),
  kind: text().notNull(),
  targetType: text('target_type').notNull(),
  targetId: uuid('target_id').notNull(),
  payload: jsonb().notNull(),
  decisionPayload: jsonb('decision_payload'),
  sources: jsonb().notNull(),
  status: text().default('pending').notNull(),
  requestingKeyId: uuid('requesting_key_id').notNull().references(() => mcpApiKeys.id),
  reviewerUserId: text('reviewer_user_id').references(() => profiles.id),
  reviewNote: text('review_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  check('mcp_metadata_drafts_kind_check', sql`${t.kind} IN ('author_links','manga_tags','manga_metadata','manga_author')`),
  check('mcp_metadata_drafts_target_type_check', sql`${t.targetType} IN ('author','manga')`),
  check('mcp_metadata_drafts_status_check', sql`${t.status} IN ('pending','approved','applied','rejected')`),
]).enableRLS();

export const mcpAuditEvents = pgTable('mcp_audit_events', {
  id: uuid().defaultRandom().primaryKey(),
  requestId: uuid('request_id').notNull(),
  keyId: uuid('key_id').notNull().references(() => mcpApiKeys.id),
  ownerUserId: text('owner_user_id').notNull().references(() => profiles.id),
  toolName: text('tool_name').notNull(),
  outcome: text().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('mcp_audit_request_idx').on(t.requestId), check('mcp_audit_events_outcome_check', sql`${t.outcome} IN ('started','success','failed')`)]).enableRLS();
