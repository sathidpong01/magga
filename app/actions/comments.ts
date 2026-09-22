"use server";

import { headers } from "next/headers";
import {
  createComment as createCommentCore,
  updateComment as updateCommentCore,
  deleteComment as deleteCommentCore,
  voteComment as voteCommentCore,
  CommentError,
} from "@/lib/comments";

// ============================================================================
// Server Actions (Thin Adapters over lib/comments)
// ============================================================================

export async function createComment(
  formData: FormData
): Promise<{ comment: any; error?: undefined } | { error: string; comment?: undefined }> {
  try {
    const callerHeaders = await headers();
    const rawData = {
      mangaId: formData.get("mangaId") as string,
      content: (formData.get("content") as string) || "",
      imageIndex: formData.get("imageIndex")
        ? Number(formData.get("imageIndex"))
        : undefined,
      imageUrl: (formData.get("imageUrl") as string) || null,
      parentId: (formData.get("parentId") as string) || null,
    };

    const comment = await createCommentCore(callerHeaders, rawData);
    return { comment };
  } catch (error: any) {
    if (error instanceof CommentError) {
      return { error: error.message };
    }
    console.error("Error creating comment:", error);
    return { error: "Failed to create comment" };
  }
}

export async function updateComment(
  formData: FormData
): Promise<{ comment: any; error?: undefined } | { error: string; comment?: undefined }> {
  try {
    const callerHeaders = await headers();
    const commentId = formData.get("commentId") as string;
    const content = (formData.get("content") as string) || "";

    const comment = await updateCommentCore(callerHeaders, {
      commentId,
      content,
    });
    return { comment };
  } catch (error: any) {
    if (error instanceof CommentError) {
      return { error: error.message };
    }
    console.error("Error updating comment:", error);
    return { error: "Failed to update comment" };
  }
}

export async function deleteComment(
  commentId: string
): Promise<{ success: boolean; error?: undefined } | { error: string; success?: undefined }> {
  try {
    const callerHeaders = await headers();
    const result = await deleteCommentCore(callerHeaders, commentId);
    return { success: result.success };
  } catch (error: any) {
    if (error instanceof CommentError) {
      return { error: error.message };
    }
    console.error("Error deleting comment:", error);
    return { error: "Failed to delete comment" };
  }
}

export async function voteComment(
  commentId: string,
  value: 1 | -1
): Promise<
  | { voteScore: number; userVote: number | null; error?: undefined }
  | { error: string; voteScore?: undefined; userVote?: undefined }
> {
  try {
    const callerHeaders = await headers();
    const result = await voteCommentCore(callerHeaders, {
      commentId,
      value,
    });
    return {
      voteScore: result.voteScore,
      userVote: result.userVote,
    };
  } catch (error: any) {
    if (error instanceof CommentError) {
      return { error: error.message };
    }
    console.error("Error voting on comment:", error);
    return { error: "Failed to vote" };
  }
}
