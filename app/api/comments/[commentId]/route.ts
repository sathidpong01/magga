import { NextResponse } from "next/server";
import {
  updateComment,
  deleteComment,
  handleCommentError,
} from "@/lib/comments";

type RouteParams = {
  params: Promise<{
    commentId: string;
  }>;
};

// PATCH /api/comments/[commentId] - Update a comment
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { commentId } = await params;
    const body = await request.json();
    const comment = await updateComment(request, {
      commentId,
      content: body?.content,
    });
    return NextResponse.json({ comment });
  } catch (error) {
    return handleCommentError(error);
  }
}

// DELETE /api/comments/[commentId] - Delete a comment
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { commentId } = await params;
    const result = await deleteComment(request, commentId);
    return NextResponse.json(result);
  } catch (error) {
    return handleCommentError(error);
  }
}
