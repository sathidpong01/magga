import { NextResponse } from 'next/server';
import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { commentReports, commentModerationEvents, comments, manga } from '@/db/schema';
import { requireModerationAdmin } from '@/lib/comments/moderation';
import { handleCommentError } from '@/lib/comments';
import { requireUuid } from '@/lib/comments/validation';
import { ValidationCommentError } from '@/lib/comments/types';
import { readCommentJson } from '@/lib/comments/request';

const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: Request) {
  try {
    await requireModerationAdmin(request);
    const params = new URL(request.url).searchParams;
    const page = Math.min(10000, Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1));
    const status = params.get('status') || 'open';
    if (!['open', 'resolved', 'dismissed', 'all'].includes(status)) throw new ValidationCommentError('Invalid report status');
    const where = status === 'all' ? undefined : eq(commentReports.status, status as 'open' | 'resolved' | 'dismissed');
    const reports = await db.select({ id: commentReports.id, commentId: commentReports.commentId, reason: commentReports.reason, details: commentReports.details, status: commentReports.status, createdAt: commentReports.createdAt, commentContent: comments.content, mangaTitle: manga.title }).from(commentReports).innerJoin(comments, eq(commentReports.commentId, comments.id)).innerJoin(manga, eq(comments.mangaId, manga.id)).where(where).orderBy(desc(commentReports.createdAt), desc(commentReports.id)).limit(20).offset((page - 1) * 20);
    const [total] = await db.select({ value: count() }).from(commentReports).where(where);
    return NextResponse.json({ reports, pagination: { page, limit: 20, total: total.value, totalPages: Math.ceil(total.value / 20) } }, { headers });
  } catch (error) { return handleCommentError(error); }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireModerationAdmin(request, true);
    const body = await readCommentJson(request) as Record<string, unknown>;
    if (!Array.isArray(body?.reportIds) || !body.reportIds.length || body.reportIds.length > 100 || typeof body.status !== 'string' || !['resolved', 'dismissed'].includes(body.status)) throw new ValidationCommentError('Invalid report update');
    const ids = [...new Set<string>(body.reportIds.map((id: unknown) => requireUuid(id, 'reportId')))];
    const updated = await db.transaction(async tx => {
      const rows = await tx.update(commentReports).set({ status: body.status as 'resolved' | 'dismissed', reviewerUserId: actor.userId, updatedAt: new Date() }).where(and(inArray(commentReports.id, ids), eq(commentReports.status, 'open'))).returning({ id: commentReports.id, commentId: commentReports.commentId });
      if (rows.length) await tx.insert(commentModerationEvents).values(rows.map(row => ({ actorUserId: actor.userId, reportId: row.id, commentId: row.commentId, action: body.status === 'resolved' ? 'resolve-report' : 'dismiss-report' })));
      return rows.length;
    });
    return NextResponse.json({ updated }, { headers });
  } catch (error) { return handleCommentError(error); }
}
