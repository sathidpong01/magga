import { pgTable, pgPolicy, text, integer, timestamp, unique, check, uuid, boolean, foreignKey, index, bigint, doublePrecision, primaryKey, customType, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

const tsvector = customType<{ data: string }>({ dataType() { return 'tsvector'; } });

export const loginAttempts = pgTable("login_attempts", {
	identifier: text().primaryKey().notNull(),
	count: integer().default(0).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'date' }).notNull(),
}, (table) => [
	pgPolicy("login_attempts_select", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("login_attempts_insert", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("login_attempts_update", { as: "permissive", for: "update", to: ["public"], using: sql`true` }),
]);

export const systemConfig = pgTable("system_config", {
	key: text().primaryKey().notNull(),
	value: text().notNull(),
	description: text(),
}, (table) => [
	pgPolicy("system_config_admin_delete", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text))))` }),
	pgPolicy("system_config_admin_update", { as: "permissive", for: "update", to: ["authenticated"], using: sql`(EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text))))` }),
	pgPolicy("system_config_admin_write", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`(EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text))))` }),
	pgPolicy("system_config_select", { as: "permissive", for: "select", to: ["public"] }),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'date' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow(),
}, (table) => [
	unique("verification_identifier_key").on(table.identifier),
]);

export const advertisements = pgTable("advertisements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	type: text().notNull(),
	title: text().notNull(),
	imageUrl: text("image_url").notNull(),
	linkUrl: text("link_url"),
	content: text(),
	placement: text().notNull(),
	repeatCount: integer("repeat_count").default(1).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	pgPolicy("advertisements_admin_delete", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text))))` }),
	pgPolicy("advertisements_admin_update", { as: "permissive", for: "update", to: ["authenticated"], using: sql`(EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text))))` }),
	pgPolicy("advertisements_admin_write", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`(EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text))))` }),
	pgPolicy("advertisements_select", { as: "permissive", for: "select", to: ["public"] }),
	check("advertisements_placement_check", sql`placement = ANY (ARRAY['grid'::text, 'header'::text, 'footer'::text, 'manga-end'::text, 'floating'::text, 'modal'::text])`),
	check("advertisements_type_check", sql`type = ANY (ARRAY['affiliate'::text, 'promptpay'::text])`),
]);

export const accounts = pgTable("accounts", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'date' }),
	password: text(),
	scope: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true, mode: 'date' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true, mode: 'date' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "accounts_user_id_fkey"
		}).onDelete("cascade"),
	unique("accounts_provider_id_account_id_key").on(table.accountId, table.providerId),
	pgPolicy("accounts_select_own", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
]);

export const sessions = pgTable("sessions", {
	id: text().primaryKey().notNull(),
	token: text().notNull(),
	userId: text("user_id").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'date' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "sessions_user_id_fkey"
		}).onDelete("cascade"),
	unique("sessions_token_key").on(table.token),
	pgPolicy("sessions_select_own", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
]);

export const profiles = pgTable("profiles", {
	id: text().primaryKey().notNull(),
	name: text(),
	email: text(),
	emailVerified: boolean("email_verified"),
	image: text(),
	username: text(),
	password: text(),
	role: text().default('user').notNull(),
	isBanned: boolean("is_banned").default(false).notNull(),
	banReason: text("ban_reason"),
	bannedAt: timestamp("banned_at", { withTimezone: true, mode: 'date' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	banned: boolean().default(false),
	commentPreference: text("comment_preference").default('sidebar').notNull(),
}, (table) => [
	unique("profiles_email_key").on(table.email),
	unique("profiles_username_key").on(table.username),
	pgPolicy("Anyone can view profiles", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Users can update own profile", { as: "permissive", for: "update", to: ["authenticated"], using: sql`(id = ( SELECT (auth.uid())::text AS uid))` }),
	check("profiles_role_check", sql`role = ANY (ARRAY['user'::text, 'admin'::text])`),
]);

export const verificationTokens = pgTable("verification_tokens", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	unique("verification_tokens_identifier_token_key").on(table.identifier, table.token),
	unique("verification_tokens_token_key").on(table.token),
]);

export const commentVotes = pgTable("comment_votes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	value: integer().notNull(),
	commentId: uuid("comment_id").notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_comment_votes_comment").using("btree", table.commentId.asc().nullsLast().op("uuid_ops")),
	index("idx_comment_votes_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.commentId],
			foreignColumns: [comments.id],
			name: "comment_votes_comment_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "comment_votes_user_id_fkey"
		}).onDelete("cascade"),
	unique("comment_votes_comment_id_user_id_key").on(table.commentId, table.userId),
	pgPolicy("Anyone can view votes", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Authenticated users can vote", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Users can change own vote", { as: "permissive", for: "update", to: ["authenticated"] }),
	pgPolicy("Users can remove own vote", { as: "permissive", for: "delete", to: ["authenticated"] }),
	check("comment_votes_value_check", sql`value = ANY (ARRAY['-1'::integer, 1])`),
]);

export const comments = pgTable("comments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	content: text().notNull(),
	imageUrl: text("image_url"),
	mangaId: uuid("manga_id").notNull(),
	userId: text("user_id").notNull(),
	imageIndex: integer("image_index"),
	parentId: uuid("parent_id"),
	voteScore: integer("vote_score").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_comments_manga").using("btree", table.mangaId.asc().nullsLast().op("uuid_ops")),
	index("idx_comments_manga_image").using("btree", table.mangaId.asc().nullsLast().op("int4_ops"), table.imageIndex.asc().nullsLast().op("int4_ops")),
	index("idx_comments_parent").using("btree", table.parentId.asc().nullsLast().op("uuid_ops")),
	index("idx_comments_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.mangaId],
			foreignColumns: [manga.id],
			name: "comments_manga_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "comments_parent_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "comments_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("comments_delete", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`((user_id = ( SELECT (auth.uid())::text AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text)))))` }),
	pgPolicy("comments_insert", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("comments_select", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("comments_update", { as: "permissive", for: "update", to: ["authenticated"] }),
]);

export const categories = pgTable("categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
}, (table) => [
	unique("categories_name_key").on(table.name),
	pgPolicy("categories_admin_delete", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text))))` }),
	pgPolicy("categories_admin_update", { as: "permissive", for: "update", to: ["authenticated"], using: sql`(EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text))))` }),
	pgPolicy("categories_admin_write", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`(EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text))))` }),
	pgPolicy("categories_select", { as: "permissive", for: "select", to: ["public"] }),
]);

export const tags = pgTable("tags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
}, (table) => [
	unique("tags_name_key").on(table.name),
	pgPolicy("tags_admin_delete", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text))))` }),
	pgPolicy("tags_admin_update", { as: "permissive", for: "update", to: ["authenticated"], using: sql`(EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text))))` }),
	pgPolicy("tags_admin_write", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`(EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text))))` }),
	pgPolicy("tags_select", { as: "permissive", for: "select", to: ["public"] }),
]);

export const authors = pgTable("authors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	profileUrl: text("profile_url"),
	socialLinks: text("social_links"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("authors_name_key").on(table.name),
	pgPolicy("authors_admin_delete", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text))))` }),
	pgPolicy("authors_admin_update", { as: "permissive", for: "update", to: ["authenticated"], using: sql`(EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text))))` }),
	pgPolicy("authors_admin_write", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`(EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text))))` }),
	pgPolicy("authors_select", { as: "permissive", for: "select", to: ["public"] }),
]);

export const manga = pgTable("manga", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	title: text().notNull(),
	description: text(),
	coverImage: text("cover_image").notNull(),
	coverWidth: integer("cover_width"),
	coverHeight: integer("cover_height"),
	pages: jsonb().notNull(),
	authorName: text("author_name"),
	extraMetadata: text("extra_metadata"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	isHidden: boolean("is_hidden").default(false).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	viewCount: bigint("view_count", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	ratingSum: bigint("rating_sum", { mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	ratingCount: bigint("rating_count", { mode: "number" }).default(0).notNull(),
	averageRating: doublePrecision("average_rating").default(0).notNull(),
	categoryId: uuid("category_id"),
	authorId: uuid("author_id"),
	fts: tsvector("fts").generatedAlwaysAs(sql`to_tsvector('english'::regconfig, ((COALESCE(title, ''::text) || ' '::text) || COALESCE(description, ''::text)))`),
}, (table) => [
	index("idx_manga_author").using("btree", table.authorId.asc().nullsLast().op("uuid_ops")),
	index("idx_manga_category").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	index("idx_manga_fts").using("gin", table.fts.asc().nullsLast().op("tsvector_ops")),
	index("idx_manga_is_hidden").using("btree", table.isHidden.asc().nullsLast().op("bool_ops")),
	index("idx_manga_recent_views").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops"), table.viewCount.desc().nullsFirst().op("int8_ops")),
	index("idx_manga_updated_at").using("btree", table.updatedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_manga_view_count").using("btree", table.viewCount.desc().nullsFirst().op("int8_ops")),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [authors.id],
			name: "manga_author_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "manga_category_id_fkey"
		}).onDelete("set null"),
	unique("manga_slug_key").on(table.slug),
	unique("manga_title_key").on(table.title),
	pgPolicy("manga_admin_delete", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text))))` }),
	pgPolicy("manga_admin_update", { as: "permissive", for: "update", to: ["authenticated"], using: sql`(EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text))))` }),
	pgPolicy("manga_admin_write", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`(EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text))))` }),
	pgPolicy("manga_select", { as: "permissive", for: "select", to: ["public"] }),
]);

export const mangaRatings = pgTable("manga_ratings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	mangaId: uuid("manga_id").notNull(),
	fingerprint: text().notNull(),
	ipAddress: text("ip_address"),
	rating: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_manga_ratings_fingerprint").using("btree", table.fingerprint.asc().nullsLast().op("text_ops")),
	index("idx_manga_ratings_manga").using("btree", table.mangaId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.mangaId],
			foreignColumns: [manga.id],
			name: "manga_ratings_manga_id_fkey"
		}).onDelete("cascade"),
	unique("manga_ratings_manga_id_fingerprint_key").on(table.mangaId, table.fingerprint),
	pgPolicy("Anyone can view ratings", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("Insert ratings with valid fingerprint", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Update ratings matching fingerprint", { as: "permissive", for: "update", to: ["public"] }),
	check("manga_ratings_rating_check", sql`(rating >= 1) AND (rating <= 5)`),
]);

export const mangaSubmissions = pgTable("manga_submissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	title: text().notNull(),
	slug: text(),
	description: text(),
	coverImage: text("cover_image").notNull(),
	pages: text().notNull(),
	categoryId: uuid("category_id"),
	authorId: uuid("author_id"),
	extraMetadata: text("extra_metadata"),
	status: text().default('PENDING').notNull(),
	submittedAt: timestamp("submitted_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: 'string' }),
	reviewedBy: text("reviewed_by"),
	reviewNote: text("review_note"),
	rejectionReason: text("rejection_reason"),
	approvedMangaId: uuid("approved_manga_id"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_submissions_author").using("btree", table.authorId.asc().nullsLast().op("uuid_ops")),
	index("idx_submissions_category").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	index("idx_submissions_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_submissions_submitted_at").using("btree", table.submittedAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_submissions_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.approvedMangaId],
			foreignColumns: [manga.id],
			name: "manga_submissions_approved_manga_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [authors.id],
			name: "manga_submissions_author_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "manga_submissions_category_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "manga_submissions_user_id_fkey"
		}).onDelete("cascade"),
	unique("manga_submissions_approved_manga_id_key").on(table.approvedMangaId),
	pgPolicy("submissions_delete", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`((user_id = ( SELECT (auth.uid())::text AS uid)) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text)))))` }),
	pgPolicy("submissions_insert", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("submissions_select", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("submissions_update", { as: "permissive", for: "update", to: ["authenticated"] }),
	check("manga_submissions_status_check", sql`status = ANY (ARRAY['PENDING'::text, 'UNDER_REVIEW'::text, 'APPROVED'::text, 'REJECTED'::text])`),
]);

export const mangaSubmissionTags = pgTable("manga_submission_tags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	submissionId: uuid("submission_id").notNull(),
	tagId: uuid("tag_id").notNull(),
}, (table) => [
	index("idx_submission_tags_tag").using("btree", table.tagId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.submissionId],
			foreignColumns: [mangaSubmissions.id],
			name: "manga_submission_tags_submission_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tagId],
			foreignColumns: [tags.id],
			name: "manga_submission_tags_tag_id_fkey"
		}).onDelete("cascade"),
	unique("manga_submission_tags_submission_id_tag_id_key").on(table.submissionId, table.tagId),
	pgPolicy("submission_tags_delete", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`true` }),
	pgPolicy("submission_tags_insert", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("submission_tags_select", { as: "permissive", for: "select", to: ["public"] }),
]);

export const userSubmissionLimits = pgTable("user_submission_limits", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	submissionCount: integer("submission_count").default(0).notNull(),
	windowStart: timestamp("window_start", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	lastSubmitAt: timestamp("last_submit_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_submission_limits_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "user_submission_limits_user_id_fkey"
		}).onDelete("cascade"),
	unique("user_submission_limits_user_id_key").on(table.userId),
	pgPolicy("submission_limits_admin_delete", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text))))` }),
	pgPolicy("submission_limits_admin_update", { as: "permissive", for: "update", to: ["authenticated"], using: sql`(user_id = ( SELECT (auth.uid())::text AS uid))` }),
	pgPolicy("submission_limits_admin_write", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`(user_id = ( SELECT (auth.uid())::text AS uid))` }),
	pgPolicy("submission_limits_select", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const mangaViews = pgTable("manga_views", {
	mangaId: uuid("manga_id").notNull(),
	ipHash: text("ip_hash").notNull(),
	viewedAt: timestamp("viewed_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_manga_views_viewed_at").using("btree", table.viewedAt.asc().nullsLast()),
	foreignKey({
			columns: [table.mangaId],
			foreignColumns: [manga.id],
			name: "manga_views_manga_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.mangaId, table.ipHash], name: "manga_views_pkey"}),
	pgPolicy("manga_views_all", { as: "permissive", for: "all", to: ["public"], using: sql`true` }),
]);

export const blockedUsers = pgTable("blocked_users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	blockedUserId: text("blocked_user_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_blocked_users_user").using("btree", table.userId.asc().nullsLast()),
	index("idx_blocked_users_blocked").using("btree", table.blockedUserId.asc().nullsLast()),
	foreignKey({ columns: [table.userId], foreignColumns: [profiles.id], name: "blocked_users_user_id_fkey" }).onDelete("cascade"),
	foreignKey({ columns: [table.blockedUserId], foreignColumns: [profiles.id], name: "blocked_users_blocked_user_id_fkey" }).onDelete("cascade"),
	unique("blocked_users_user_id_blocked_user_id_key").on(table.userId, table.blockedUserId),
	pgPolicy("blocked_users_select", { as: "permissive", for: "select", to: ["authenticated"], using: sql`user_id = (SELECT auth.uid()::text)` }),
	pgPolicy("blocked_users_insert", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`user_id = (SELECT auth.uid()::text)` }),
	pgPolicy("blocked_users_delete", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`user_id = (SELECT auth.uid()::text)` }),
]);

export const blockedTags = pgTable("blocked_tags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	tagId: uuid("tag_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => [
	index("idx_blocked_tags_user").using("btree", table.userId.asc().nullsLast()),
	index("idx_blocked_tags_tag").using("btree", table.tagId.asc().nullsLast()),
	foreignKey({ columns: [table.userId], foreignColumns: [profiles.id], name: "blocked_tags_user_id_fkey" }).onDelete("cascade"),
	foreignKey({ columns: [table.tagId], foreignColumns: [tags.id], name: "blocked_tags_tag_id_fkey" }).onDelete("cascade"),
	unique("blocked_tags_user_id_tag_id_key").on(table.userId, table.tagId),
	pgPolicy("blocked_tags_select", { as: "permissive", for: "select", to: ["authenticated"], using: sql`user_id = (SELECT auth.uid()::text)` }),
	pgPolicy("blocked_tags_insert", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`user_id = (SELECT auth.uid()::text)` }),
	pgPolicy("blocked_tags_delete", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`user_id = (SELECT auth.uid()::text)` }),
]);

export const mangaTags = pgTable("manga_tags", {
	mangaId: uuid("manga_id").notNull(),
	tagId: uuid("tag_id").notNull(),
}, (table) => [
	index("idx_manga_tags_tag").using("btree", table.tagId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.mangaId],
			foreignColumns: [manga.id],
			name: "manga_tags_manga_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tagId],
			foreignColumns: [tags.id],
			name: "manga_tags_tag_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.mangaId, table.tagId], name: "manga_tags_pkey"}),
	pgPolicy("manga_tags_admin_delete", { as: "permissive", for: "delete", to: ["authenticated"], using: sql`(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT (auth.uid())::text AS uid)) AND (profiles.role = 'admin'::text))))` }),
	pgPolicy("manga_tags_admin_write", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("manga_tags_select", { as: "permissive", for: "select", to: ["public"] }),
]);
