import { NextResponse } from "next/server";
import { db } from "@/db";
import { comments as commentsTable, commentVotes, profiles as profilesTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

type RouteParams = {
  params: Promise<{
    commentId: string;
  }>;
};

// PATCH /api/comments/[commentId] - Update a comment
export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: request.headers });
  const { commentId } = await params;
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const MAX_CONTENT_LENGTH = 500;
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: `ความคิดเห็นต้องไม่เกิน ${MAX_CONTENT_LENGTH} ตัวอักษร` }, { status: 400 });
    }

    // Find the comment
    const [comment] = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.id, commentId))
      .limit(1);
    
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Only owner can edit
    if (comment.userId !== session.user.id) {
      return NextResponse.json({ error: "You can only edit your own comments" }, { status: 403 });
    }

    // Sanitize content
    const sanitizedContent = content.trim()
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const [updated] = await db
      .update(commentsTable)
      .set({ content: sanitizedContent })
      .where(eq(commentsTable.id, commentId))
      .returning();

    return NextResponse.json({ comment: updated });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}

// DELETE /api/comments/[commentId] - Delete a comment
export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: request.headers });
  const { commentId } = await params;
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [comment] = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.id, commentId))
      .limit(1);
    
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Owner or admin can delete
    const isOwner = comment.userId === session.user.id;
    const isAdmin = (session.user as { role?: string }).role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "You don't have permission to delete this comment" }, { status: 403 });
    }

    await db.delete(commentsTable).where(eq(commentsTable.id, commentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
