import { relations } from "drizzle-orm/relations";
import { profiles, accounts, sessions, comments, commentVotes, manga, authors, categories, mangaRatings, mangaSubmissions, mangaSubmissionTags, tags, userSubmissionLimits, mangaTags, blockedUsers, blockedTags, mangaViews } from "./schema";

export const accountsRelations = relations(accounts, ({one}) => ({
	profile: one(profiles, {
		fields: [accounts.userId],
		references: [profiles.id]
	}),
}));

export const profilesRelations = relations(profiles, ({many}) => ({
	accounts: many(accounts),
	sessions: many(sessions),
	commentVotes: many(commentVotes),
	comments: many(comments),
	mangaSubmissions: many(mangaSubmissions),
	userSubmissionLimits: many(userSubmissionLimits),
	blockedUsers: many(blockedUsers, { relationName: "blockedUsers_userId" }),
	blockedByUsers: many(blockedUsers, { relationName: "blockedUsers_blockedUserId" }),
	blockedTags: many(blockedTags),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	profile: one(profiles, {
		fields: [sessions.userId],
		references: [profiles.id]
	}),
}));

export const commentVotesRelations = relations(commentVotes, ({one}) => ({
	comment: one(comments, {
		fields: [commentVotes.commentId],
		references: [comments.id]
	}),
	profile: one(profiles, {
		fields: [commentVotes.userId],
		references: [profiles.id]
	}),
}));

export const commentsRelations = relations(comments, ({one, many}) => ({
	commentVotes: many(commentVotes),
	manga: one(manga, {
		fields: [comments.mangaId],
		references: [manga.id]
	}),
	comment: one(comments, {
		fields: [comments.parentId],
		references: [comments.id],
		relationName: "comments_parentId_comments_id"
	}),
	comments: many(comments, {
		relationName: "comments_parentId_comments_id"
	}),
	profile: one(profiles, {
		fields: [comments.userId],
		references: [profiles.id]
	}),
}));

export const mangaRelations = relations(manga, ({one, many}) => ({
	comments: many(comments),
	author: one(authors, {
		fields: [manga.authorId],
		references: [authors.id]
	}),
	category: one(categories, {
		fields: [manga.categoryId],
		references: [categories.id]
	}),
	mangaRatings: many(mangaRatings),
	mangaSubmissions: many(mangaSubmissions),
	mangaViews: many(mangaViews),
	mangaTags_mangaId: many(mangaTags, {
		relationName: "mangaTags_mangaId_manga_id"
	}),
}));

export const authorsRelations = relations(authors, ({many}) => ({
	manga: many(manga),
	mangaSubmissions: many(mangaSubmissions),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	manga: many(manga),
	mangaSubmissions: many(mangaSubmissions),
}));

export const mangaRatingsRelations = relations(mangaRatings, ({one}) => ({
	manga: one(manga, {
		fields: [mangaRatings.mangaId],
		references: [manga.id]
	}),
}));

export const mangaSubmissionsRelations = relations(mangaSubmissions, ({one, many}) => ({
	manga: one(manga, {
		fields: [mangaSubmissions.approvedMangaId],
		references: [manga.id]
	}),
	author: one(authors, {
		fields: [mangaSubmissions.authorId],
		references: [authors.id]
	}),
	category: one(categories, {
		fields: [mangaSubmissions.categoryId],
		references: [categories.id]
	}),
	profile: one(profiles, {
		fields: [mangaSubmissions.userId],
		references: [profiles.id]
	}),
	mangaSubmissionTags: many(mangaSubmissionTags),
}));

export const mangaSubmissionTagsRelations = relations(mangaSubmissionTags, ({one}) => ({
	mangaSubmission: one(mangaSubmissions, {
		fields: [mangaSubmissionTags.submissionId],
		references: [mangaSubmissions.id]
	}),
	tag: one(tags, {
		fields: [mangaSubmissionTags.tagId],
		references: [tags.id]
	}),
}));

export const tagsRelations = relations(tags, ({many}) => ({
	mangaSubmissionTags: many(mangaSubmissionTags),
	mangaTags_tagId: many(mangaTags, {
		relationName: "mangaTags_tagId_tags_id"
	}),
	blockedTags: many(blockedTags),
}));

export const userSubmissionLimitsRelations = relations(userSubmissionLimits, ({one}) => ({
	profile: one(profiles, {
		fields: [userSubmissionLimits.userId],
		references: [profiles.id]
	}),
}));

export const mangaViewsRelations = relations(mangaViews, ({one}) => ({
	manga: one(manga, {
		fields: [mangaViews.mangaId],
		references: [manga.id],
	}),
}));

export const blockedUsersRelations = relations(blockedUsers, ({one}) => ({
	user: one(profiles, {
		fields: [blockedUsers.userId],
		references: [profiles.id],
		relationName: "blockedUsers_userId",
	}),
	blockedUser: one(profiles, {
		fields: [blockedUsers.blockedUserId],
		references: [profiles.id],
		relationName: "blockedUsers_blockedUserId",
	}),
}));

export const blockedTagsRelations = relations(blockedTags, ({one}) => ({
	user: one(profiles, {
		fields: [blockedTags.userId],
		references: [profiles.id],
	}),
	tag: one(tags, {
		fields: [blockedTags.tagId],
		references: [tags.id],
	}),
}));

export const mangaTagsRelations = relations(mangaTags, ({one}) => ({
	manga_mangaId: one(manga, {
		fields: [mangaTags.mangaId],
		references: [manga.id],
		relationName: "mangaTags_mangaId_manga_id"
	}),
	tag_tagId: one(tags, {
		fields: [mangaTags.tagId],
		references: [tags.id],
		relationName: "mangaTags_tagId_tags_id"
	}),
}));