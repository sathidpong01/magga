"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { comments as commentsTable, commentVotes as commentVotesTable, manga as mangaTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { headers } from "next/headers";

// ============================================================================
// Schema Definitions
// ============================================================================

const CreateCommentSchema = z
  .object({
    mangaId: z.string().min(1, "mangaId is required"),
    content: z.string().max(500, "ความคิดเห็นต้องไม่เกิน 500 ตัวอักษร"),
    imageIndex: z.number().optional(),
    imageUrl: z.string().url().optional().nullable(),
    parentId: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      return (data.content && data.content.trim().length > 0) || data.imageUrl;
    },
    {
      message: "ต้องมีข้อความหรือรูปภาพอย่างน้อยหนึ่งอย่าง",
      path: ["content"],
    }
  );

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
  const [manga] = await db
    .select({ slug: mangaTable.slug })
    .from(mangaTable)
    .where(eq(mangaTable.id, mangaId))
    .limit(1);
  return manga?.slug ?? null;
}

// ============================================================================
// Server Actions
// ============================================================================

export async function createComment(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { error: "กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น" };
  }

  if ((session.user as any).banned) {
    return { error: "บัญชีของคุณถูกระงับการใช้งาน" };
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

  const rawData = {
    mangaId: formData.get("mangaId") as string,
    content: formData.get("content") as string,
    imageIndex: formData.get("imageIndex")
      ? Number(formData.get("imageIndex"))
      : undefined,
    imageUrl: (formData.get("imageUrl") as string) || null,
    parentId: (formData.get("parentId") as string) || null,
  };

  const parsed = CreateCommentSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };
  }

  const { mangaId, content, imageIndex, imageUrl, parentId } = parsed.data;

  try {
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
    const [manga] = await db
      .select({ id: mangaTable.id, slug: mangaTable.slug, isHidden: mangaTable.isHidden })
      .from(mangaTable)
      .where(eq(mangaTable.id, mangaId))
      .limit(1);

    if (!manga) {
      return { error: "Manga not found" };
    }

    const userRole = (session.user as { role?: string }).role;
    if (manga.isHidden && userRole !== "admin") {
      return { error: "Cannot comment on hidden manga" };
    }

    // Verify parent comment if replying
    if (parentId) {
      const [parent] = await db
        .select({ id: commentsTable.id })
        .from(commentsTable)
        .where(eq(commentsTable.id, parentId))
        .limit(1);
      if (!parent) {
        return { error: "Parent comment not found" };
      }
    }

    // Create comment
    const [comment] = await db
      .insert(commentsTable)
      .values({
        content: sanitizeContent(content),
        imageUrl: imageUrl || null,
        mangaId,
        userId: session.user.id,
        imageIndex: imageIndex ?? null,
        parentId: parentId || null,
      })
      .returning();

    revalidatePath(`/${manga.slug}`);

    return { comment };
  } catch (error) {
    console.error("Error creating comment:", error);
    return { error: "Failed to create comment" };
  }
}

export async function updateComment(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });

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
    const [comment] = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.id, commentId))
      .limit(1);

    if (!comment) {
      return { error: "Comment not found" };
    }

    if (comment.userId !== session.user.id) {
      return { error: "You can only edit your own comments" };
    }

    const [updated] = await db
      .update(commentsTable)
      .set({ content: sanitizeContent(content) })
      .where(eq(commentsTable.id, commentId))
      .returning();

    const mangaSlug = await getMangaSlug(comment.mangaId);
    if (mangaSlug) {
      revalidatePath(`/${mangaSlug}`);
    }

    return { comment: updated };
  } catch (error) {
    console.error("Error updating comment:", error);
    return { error: "Failed to update comment" };
  }
}

export async function deleteComment(commentId: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const [comment] = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.id, commentId))
      .limit(1);

    if (!comment) {
      return { error: "Comment not found" };
    }

    const isOwner = comment.userId === session.user.id;
    const isAdmin = (session.user as { role?: string }).role === "admin";

    if (!isOwner && !isAdmin) {
      return { error: "You don't have permission to delete this comment" };
    }

    await db.delete(commentsTable).where(eq(commentsTable.id, commentId));

    const mangaSlug = await getMangaSlug(comment.mangaId);
    if (mangaSlug) {
      revalidatePath(`/${mangaSlug}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return { error: "Failed to delete comment" };
  }
}

export async function voteComment(commentId: string, value: 1 | -1) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { error: "กรุณาเข้าสู่ระบบก่อนโหวต" };
  }

  if ((session.user as any).banned) {
    return { error: "บัญชีของคุณถูกระงับการใช้งาน" };
  }

  const rateLimit = await checkRateLimit(
    `vote:${session.user.id}`,
    30,
    15 * 60 * 1000
  );

  if (!rateLimit.allowed) {
    const waitMins = Math.ceil((rateLimit.resetTime! - Date.now()) / 60000);
    return { error: `คุณโหวตเร็วเกินไป กรุณารอ ${waitMins} นาที` };
  }

  if (value !== 1 && value !== -1) {
    return { error: "Vote value must be 1 or -1" };
  }

  try {
    const [comment] = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.id, commentId))
      .limit(1);

    if (!comment) {
      return { error: "Comment not found" };
    }

    const [existingVote] = await db
      .select()
      .from(commentVotesTable)
      .where(
        and(
          eq(commentVotesTable.commentId, commentId),
          eq(commentVotesTable.userId, session.user.id)
        )
      )
      .limit(1);

    let newVoteScore = comment.voteScore;

    if (existingVote) {
      if (existingVote.value === value) {
        await db.delete(commentVotesTable).where(eq(commentVotesTable.id, existingVote.id));
        newVoteScore -= value;
      } else {
        await db
          .update(commentVotesTable)
          .set({ value })
          .where(eq(commentVotesTable.id, existingVote.id));
        newVoteScore += value * 2;
      }
    } else {
      await db.insert(commentVotesTable).values({
        commentId,
        userId: session.user.id,
        value,
      });
      newVoteScore += value;
    }

    await db
      .update(commentsTable)
      .set({ voteScore: newVoteScore })
      .where(eq(commentsTable.id, commentId));

    const [userVote] = await db
      .select()
      .from(commentVotesTable)
      .where(
        and(
          eq(commentVotesTable.commentId, commentId),
          eq(commentVotesTable.userId, session.user.id)
        )
      )
      .limit(1);

    const mangaSlug = await getMangaSlug(comment.mangaId);
    if (mangaSlug) {
      revalidatePath(`/${mangaSlug}`);
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
