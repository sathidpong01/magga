import { NextResponse } from "next/server";
import { voteComment, handleCommentError } from "@/lib/comments";

type RouteParams = {
  params: Promise<{
    commentId: string;
  }>;
};

// POST /api/comments/[commentId]/vote - Vote on a comment
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { commentId } = await params;
    const body = await request.json();
    const result = await voteComment(request, {
      commentId,
      value: body?.value,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleCommentError(error);
  }
}
