import { retireCommentAssets, purgeRetiredCommentAssets } from './assets';
import { and, inArray, isNotNull, or } from 'drizzle-orm';
import { db } from '@/db';
import { manga, comments, commentReports, commentModerationEvents } from '@/db/schema';

/** Explicit manga removal also removes its moderation records, while keeping
 * tracked R2 objects immediately. */
export async function removeMangaWithComments(mangaIds: string[]) {
  if (!mangaIds.length) return [];
  const retired: string[] = [];
  const deleted = await db.transaction(async tx => {
    const selected = await tx.select({ id: manga.id }).from(manga).where(inArray(manga.id, mangaIds)).for('update');
    if (!selected.length) return [];
    const ids = selected.map(row => row.id);
    const rows = await tx.select({ id: comments.id }).from(comments).where(inArray(comments.mangaId, ids)).orderBy(comments.id).for('update');
    const commentIds = rows.map(row => row.id);
    if (commentIds.length) {
      const reports = await tx.select({ id: commentReports.id }).from(commentReports).where(inArray(commentReports.commentId, commentIds));
      await tx.delete(commentModerationEvents).where(or(inArray(commentModerationEvents.commentId, commentIds), reports.length ? inArray(commentModerationEvents.reportId, reports.map(row => row.id)) : undefined));
      await tx.delete(commentReports).where(inArray(commentReports.commentId, commentIds));
      for (const id of commentIds) retired.push(...await retireCommentAssets(tx, id));
      // Replies are removed before roots because ordinary comment deletion is restricted.
      await tx.delete(comments).where(and(inArray(comments.id, commentIds), isNotNull(comments.parentId)));
      await tx.delete(comments).where(inArray(comments.id, commentIds));
    }
    return tx.delete(manga).where(inArray(manga.id, ids)).returning({ id: manga.id });
  });
  await purgeRetiredCommentAssets(retired);
  return deleted;
}
