import { NextResponse } from "next/server";
import { readCommentJson } from "@/lib/comments/request";
import { voteComment, handleCommentError, ValidationCommentError } from "@/lib/comments";

type RouteParams = {
  params: Promise<{
    commentId: string;
  }>;
};

// POST /api/comments/[commentId]/vote - Vote on a comment
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { commentId } = await params;
    const body = await readCommentJson(request) as { value?: 1 | -1 } | null;
    if (body?.value !== 1 && body?.value !== -1) throw new ValidationCommentError("คะแนนไม่ถูกต้อง");
    const result = await voteComment(request, {
      commentId,
      value: body?.value,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleCommentError(error);
  }
}
