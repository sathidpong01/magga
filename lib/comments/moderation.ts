import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { comments, profiles, commentGuests, commentGuestSessions, commentModerationEvents, commentReports } from '@/db/schema';
import { requireCommentActor, assertCommentOrigin } from './identity';
import { consumeCommentLimit } from './abuse';
import { ForbiddenCommentError, ValidationCommentError } from './types';
import { requireUuid } from './validation';
import { retireCommentAssets } from './assets';

export const MODERATION_ACTIONS = ['delete', 'ban-guest', 'unban-guest'] as const;
export type ModerationAction = typeof MODERATION_ACTIONS[number];
export function parseModerationBody(body: unknown) {
  if (!body || typeof body !== 'object') throw new ValidationCommentError('Invalid moderation request');
  const input = body as Record<string, unknown>;
  if (!Array.isArray(input.commentIds) || !input.commentIds.length || input.commentIds.length > 100) throw new ValidationCommentError('Select between 1 and 100 comments');
  const commentIds = [...new Set(input.commentIds.map(id => requireUuid(id, 'commentId')))];
  if (!MODERATION_ACTIONS.includes(input.action as ModerationAction)) throw new ValidationCommentError('Invalid moderation action');
  if (input.reason !== undefined && (typeof input.reason !== 'string' || input.reason.length > 500)) throw new ValidationCommentError('Reason must be at most 500 characters');
  return { commentIds, action: input.action as ModerationAction, reason: typeof input.reason === 'string' ? input.reason.trim() : null };
}

export async function requireModerationAdmin(request: Request, mutation = false) {
  if (mutation) assertCommentOrigin(request.headers);
  const actor = await requireCommentActor(request.headers);
  if (actor.kind !== 'member' || actor.role !== 'admin') throw new ForbiddenCommentError();
  // Re-read the database: a cached auth session cannot retain revoked admin privileges.
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, actor.userId)).limit(1);
  if (!profile || profile.role !== 'admin' || profile.isBanned || profile.banned) throw new ForbiddenCommentError();
  if (mutation) await consumeCommentLimit(actor, request.headers, 'moderation');
  return actor;
}

export async function moderateComments(request: Request, body: unknown) {
  const actor = await requireModerationAdmin(request, true);
  const { commentIds, action, reason } = parseModerationBody(body);
  return db.transaction(async tx => {
    const selected = await tx.select({ id: comments.id, guestId: comments.guestId, content: comments.content, imageUrl: comments.imageUrl, status: comments.status }).from(comments).where(inArray(comments.id, commentIds)).orderBy(comments.id).for('update');
    const ids = selected.map(c => c.id);
    if (!ids.length) return { updated: 0, deleted: 0 };
    if (action === 'ban-guest' || action === 'unban-guest') {
      const guestIds = [...new Set(selected.flatMap(c => c.guestId ? [c.guestId] : []))];
      if (!guestIds.length) throw new ValidationCommentError('Selected comments have no guest authors');
      await tx.update(commentGuests).set({ isBanned: action === 'ban-guest', banReason: action === 'ban-guest' ? reason : null, updatedAt: new Date() }).where(inArray(commentGuests.id, guestIds));
      if (action === 'ban-guest') await tx.update(commentGuestSessions).set({ revokedAt: new Date() }).where(inArray(commentGuestSessions.guestId, guestIds));
    } else {
      for (const comment of selected) {
        if (action === 'delete') {
          await retireCommentAssets(tx, comment.id);
          await tx.update(comments).set({ status: 'deleted', content: '', imageUrl: null, updatedAt: new Date().toISOString() }).where(eq(comments.id, comment.id));

        }
      }
    }
    await tx.insert(commentModerationEvents).values(selected.map(c => ({ actorUserId: actor.userId, commentId: c.id, guestId: c.guestId, action, reason })));
    return { updated: ids.length, deleted: action === 'delete' ? ids.length : 0 };
  });
}

export function parseReportBody(body: unknown) {
  if (!body || typeof body !== 'object') throw new ValidationCommentError('Invalid report');
  const input = body as Record<string, unknown>;
  if (!['spam', 'abuse', 'image', 'other'].includes(input.reason as string)) throw new ValidationCommentError('Invalid report reason');
  if (input.details !== undefined && (typeof input.details !== 'string' || input.details.length > 500)) throw new ValidationCommentError('Details must be at most 500 characters');
  return { reason: input.reason as 'spam' | 'abuse' | 'image' | 'other', details: typeof input.details === 'string' ? input.details.trim() : null };
}

export async function reportComment(request: Request, commentId: unknown, body: unknown) {
  assertCommentOrigin(request.headers);
  const id = requireUuid(commentId, 'commentId');
  const input = parseReportBody(body);
  const actor = await requireCommentActor(request.headers);
  await consumeCommentLimit(actor, request.headers, 'report');
  // Reuse public visibility rules and do not expose pending or hidden records by ID.
  const { manga } = await import('@/db/schema');
  const [comment] = await db.select({ id: comments.id }).from(comments).innerJoin(manga, eq(comments.mangaId, manga.id)).where(and(eq(comments.id, id), eq(comments.status, 'published'), eq(manga.isHidden, false))).limit(1);
  if (!comment) throw new ValidationCommentError('Comment is unavailable');
  await db.insert(commentReports).values({ commentId: id, userId: actor.kind === 'member' ? actor.userId : null, guestId: actor.kind === 'guest' ? actor.guestId : null, ...input }).onConflictDoNothing();
  return { reported: true };
}
