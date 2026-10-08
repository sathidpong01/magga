import { NextRequest, NextResponse } from "next/server";
import { requireModerationAdmin } from "@/lib/comments/moderation";
import { deleteUserPreservingComments } from "@/lib/comments/user-removal";
import { handleCommentError } from "@/lib/comments";

// DELETE - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireModerationAdmin(request,true);
    
    const { id } = await params;

    // Prevent self-deletion
    if (id === actor.userId) {
      return NextResponse.json(
        { error: "Cannot delete yourself" },
        { status: 400 }
      );
    }

    return NextResponse.json(await deleteUserPreservingComments(id),{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return handleCommentError(error);
  }
}
