import { NextResponse } from 'next/server';
import { readCommentJson } from '@/lib/comments/request';
import { reportComment } from '@/lib/comments/moderation';
import { handleCommentError } from '@/lib/comments';
export async function POST(request: Request, context: { params: Promise<{ commentId: string }> }) {
  try { const { commentId } = await context.params; return NextResponse.json(await reportComment(request, commentId, await readCommentJson(request)), { headers: { 'Cache-Control': 'private, no-store' } }); }
  catch (error) { return handleCommentError(error); }
}
