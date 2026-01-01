"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ============================================================================
// Schema Definitions
// ============================================================================

const CreateCommentSchema = z.object({
  mangaId: z.string().min(1, "mangaId is required"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(500, "ความคิดเห็นต้องไม่เกิน 500 ตัวอักษร"),
  imageIndex: z.number().optional(),
  imageUrl: z.string().url().optional().nullable(),
  parentId: z.string().optional().nullable(),
});

const UpdateCommentSchema = z.object({
  commentId: z.string().min(1),
  content: z
    .string()
    .min(1, "Content is required")
    .max(500, "ความคิดเห็นต้องไม่เกิน 500 ตัวอักษร"),
});

// ============================================================================
// Helper Functions
// ============================================================================

function sanitizeContent(content: string): string {
  return content.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function getMangaSlug(mangaId: string): Promise<string | null> {
  const manga = await prisma.manga.findUnique({
    where: { id: mangaId },
    select: { slug: true },
  });
  return manga?.slug ?? null;
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Create a new comment (Server Action)
 */
export async function createComment(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น" };
  }

  // Rate limiting: 20 comments per 15 minutes
  const rateLimit = await checkRateLimit(
    `comment:${session.user.id}`,
    20,
    15 * 60 * 1000
  );

  if (!rateLimit.allowed) {
    const waitMins = Math.ceil((rateLimit.resetTime! - Date.now()) / 60000);
    return { error: `คุณคอมเมนต์เร็วเกินไป กรุณารอ ${waitMins} นาที` };
  }

  // Parse form data
  const rawData = {
    mangaId: formData.get("mangaId") as string,
    content: formData.get("content") as string,
    imageIndex: formData.get("imageIndex")
      ? Number(formData.get("imageIndex"))
      : undefined,
    imageUrl: (formData.get("imageUrl") as string) || null,
    parentId: (formData.get("parentId") as string) || null,
  };

  // Validate
  const parsed = CreateCommentSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };
  }

  const { mangaId, content, imageIndex, imageUrl, parentId } = parsed.data;

  try {
    // Validate imageUrl if provided
    if (imageUrl) {
      const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
      if (
        R2_PUBLIC_URL &&
        !imageUrl.startsWith(R2_PUBLIC_URL) &&
        !imageUrl.startsWith("/uploads/")
      ) {
        return { error: "Invalid image URL" };
      }
    }

    // Verify manga exists
    const manga = await prisma.manga.findUnique({
      where: { id: mangaId },
      select: { id: true, slug: true, isHidden: true },
    });

    if (!manga) {
      return { error: "Manga not found" };
    }

    // Don't allow comments on hidden manga (unless admin)
    const userRole = (session.user as { role?: string }).role;
    if (manga.isHidden && userRole !== "ADMIN") {
      return { error: "Cannot comment on hidden manga" };
    }

    // Verify parent comment if replying
    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return { error: "Parent comment not found" };
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: sanitizeContent(content),
        imageUrl: imageUrl || null,
        mangaId,
        userId: session.user.id,
        imageIndex: imageIndex ?? null,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
        votes: true,
        replies: true,
      },
    });

    // Revalidate manga page
    revalidatePath(`/${manga.slug}`);

    return { comment };
  } catch (error) {
    console.error("Error creating comment:", error);
    return { error: "Failed to create comment" };
  }
}

/**
 * Update an existing comment (Server Action)
 */
export async function updateComment(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const rawData = {
    commentId: formData.get("commentId") as string,
    content: formData.get("content") as string,
  };

  const parsed = UpdateCommentSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };
  }

  const { commentId, content } = parsed.data;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { manga: { select: { slug: true } } },
    });

    if (!comment) {
      return { error: "Comment not found" };
    }

    // Only owner can edit
    if (comment.userId !== session.user.id) {
      return { error: "You can only edit your own comments" };
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: sanitizeContent(content) },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
        votes: true,
      },
    });

    // Revalidate manga page
    if (comment.manga?.slug) {
      revalidatePath(`/${comment.manga.slug}`);
    }

    return { comment: updated };
  } catch (error) {
    console.error("Error updating comment:", error);
    return { error: "Failed to update comment" };
  }
}

/**
 * Delete a comment (Server Action)
 */
export async function deleteComment(commentId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { manga: { select: { slug: true } } },
    });

    if (!comment) {
      return { error: "Comment not found" };
    }

    // Owner or admin can delete
    const isOwner = comment.userId === session.user.id;
    const isAdmin = (session.user as { role?: string }).role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return { error: "You don't have permission to delete this comment" };
    }

    await prisma.comment.delete({ where: { id: commentId } });

    // Revalidate manga page
    if (comment.manga?.slug) {
      revalidatePath(`/${comment.manga.slug}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return { error: "Failed to delete comment" };
  }
}

/**
 * Vote on a comment (Server Action)
 */
export async function voteComment(commentId: string, value: 1 | -1) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "กรุณาเข้าสู่ระบบก่อนโหวต" };
  }

  // Rate limiting: 30 votes per 15 minutes
  const rateLimit = await checkRateLimit(
    `vote:${session.user.id}`,
    30,
    15 * 60 * 1000
  );

  if (!rateLimit.allowed) {
    const waitMins = Math.ceil((rateLimit.resetTime! - Date.now()) / 60000);
    return { error: `คุณโหวตเร็วเกินไป กรุณารอ ${waitMins} นาที` };
  }

  // Validate vote value
  if (value !== 1 && value !== -1) {
    return { error: "Vote value must be 1 or -1" };
  }

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { manga: { select: { slug: true } } },
    });

    if (!comment) {
      return { error: "Comment not found" };
    }

    // Check existing vote
    const existingVote = await prisma.commentVote.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId: session.user.id,
        },
      },
    });

    let newVoteScore = comment.voteScore;

    if (existingVote) {
      if (existingVote.value === value) {
        // Same vote = remove vote
        await prisma.commentVote.delete({ where: { id: existingVote.id } });
        newVoteScore -= value;
      } else {
        // Different vote = update (swing of 2)
        await prisma.commentVote.update({
          where: { id: existingVote.id },
          data: { value },
        });
        newVoteScore += value * 2;
      }
    } else {
      // New vote
      await prisma.commentVote.create({
        data: {
          commentId,
          userId: session.user.id,
          value,
        },
      });
      newVoteScore += value;
    }

    // Update cached vote score
    await prisma.comment.update({
      where: { id: commentId },
      data: { voteScore: newVoteScore },
    });

    // Get user's current vote
    const userVote = await prisma.commentVote.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId: session.user.id,
        },
      },
    });

    // Revalidate manga page
    if (comment.manga?.slug) {
      revalidatePath(`/${comment.manga.slug}`);
    }

    return {
      voteScore: newVoteScore,
      userVote: userVote?.value ?? null,
    };
  } catch (error) {
    console.error("Error voting on comment:", error);
    return { error: "Failed to vote" };
  }
}
