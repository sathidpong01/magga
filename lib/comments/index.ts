import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq, and, isNull, desc, asc, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  comments as commentsTable,
  commentVotes as commentVotesTable,
  manga as mangaTable,
} from "@/db/schema";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeContent } from "@/lib/sanitize";
import { authenticateCaller, type CallerContext } from "@/lib/auth-helpers";
import {
  CommentError,
  UnauthorizedCommentError,
  ForbiddenCommentError,
  NotFoundCommentError,
  RateLimitCommentError,
  ValidationCommentError,
  type CallerInput,
  type CreateCommentInput,
  type UpdateCommentInput,
  type VoteCommentInput,
  type ListCommentsOptions,
  type CommentListResult,
  type CommentVoteResult,
} from "./types";
import { parseCommentCursor, getNextCommentCursor } from "./pagination";

export * from "./types";
export * from "./pagination";

// ============================================================================
// Internal Helpers
// ============================================================================

async function resolveCaller(
  caller: CallerInput,
  unauthMessage: string
): Promise<CallerContext> {
  if (
    typeof caller === "object" &&
    caller !== null &&
    "user" in caller &&
    "canModify" in caller &&
    typeof (caller as CallerContext).canModify === "function"
  ) {
    const ctx = caller as CallerContext;
    if (!ctx.user?.id) {
      throw new UnauthorizedCommentError(unauthMessage);
    }
    return ctx;
  }

  let headers: Headers | HeadersInit | null = null;
  if (caller instanceof Request) {
    headers = caller.headers;
  } else if (
    typeof caller === "object" &&
    caller !== null &&
    "headers" in caller &&
    (caller as unknown as { headers: unknown }).headers instanceof Headers
  ) {
    headers = (caller as unknown as { headers: Headers }).headers;
  } else {
    headers = caller as Headers | HeadersInit;
  }

  const authResult = await authenticateCaller(headers);
  if (!authResult.ok) {
    if (authResult.code === "BANNED") {
      throw new ForbiddenCommentError(authResult.error);
    }
    throw new UnauthorizedCommentError(unauthMessage);
  }
  return authResult.caller;
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
// Error Handler for Route Handlers
// ============================================================================

export function handleCommentError(error: unknown): NextResponse {
  if (error instanceof CommentError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  console.error("Unexpected comment error:", error);
  return NextResponse.json(
    { error: "Internal Server Error" },
    { status: 500 }
  );
}

// ============================================================================
// Domain Functions
// ============================================================================

/**
 * Creates a new comment or reply.
 */
export async function createComment(
  callerInput: CallerInput,
  input: CreateCommentInput
) {
  const caller = await resolveCaller(
    callerInput,
    "กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น"
  );

  const { mangaId, content, imageIndex, imageUrl, parentId } = input;

  if (!mangaId || typeof mangaId !== "string" || !mangaId.trim()) {
    throw new ValidationCommentError("mangaId is required");
  }

  const trimmedContent = typeof content === "string" ? content.trim() : "";
  const trimmedImageUrl =
    typeof imageUrl === "string" && imageUrl.trim().length > 0
      ? imageUrl.trim()
      : null;

  if (content && content.length > 500) {
    throw new ValidationCommentError("ความคิดเห็นต้องไม่เกิน 500 ตัวอักษร");
  }

  if (!trimmedContent && !trimmedImageUrl) {
    throw new ValidationCommentError(
      "ต้องมีข้อความหรือรูปภาพอย่างน้อยหนึ่งอย่าง"
    );
  }

  if (trimmedImageUrl) {
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
    if (
      (R2_PUBLIC_URL &&
        !trimmedImageUrl.startsWith(R2_PUBLIC_URL) &&
        !trimmedImageUrl.startsWith("/uploads/")) ||
      (!R2_PUBLIC_URL &&
        !trimmedImageUrl.startsWith("/uploads/") &&
        !trimmedImageUrl.startsWith("http://") &&
        !trimmedImageUrl.startsWith("https://"))
    ) {
      throw new ValidationCommentError("Invalid image URL");
    }
  }

  // Rate limiting: 20 comments per 15 minutes
  const rateLimit = await checkRateLimit(
    `comment:${caller.user.id}`,
    20,
    15 * 60 * 1000
  );

  if (!rateLimit.allowed) {
    const waitMins = Math.ceil(
      ((rateLimit.resetTime ?? Date.now()) - Date.now()) / 60000
    );
    throw new RateLimitCommentError(
      `คุณคอมเมนต์เร็วเกินไป กรุณารอ ${waitMins} นาที`,
      rateLimit.resetTime,
      waitMins
    );
  }

  // Verify manga exists
  const [manga] = await db
    .select({
      id: mangaTable.id,
      slug: mangaTable.slug,
      isHidden: mangaTable.isHidden,
    })
    .from(mangaTable)
    .where(eq(mangaTable.id, mangaId))
    .limit(1);

  if (!manga) {
    throw new NotFoundCommentError("Manga not found");
  }

  if (manga.isHidden && caller.user.role !== "admin") {
    throw new ForbiddenCommentError("Cannot comment on hidden manga");
  }

  // Verify parent comment if replying
  if (parentId) {
    const [parent] = await db
      .select({ id: commentsTable.id })
      .from(commentsTable)
      .where(eq(commentsTable.id, parentId))
      .limit(1);
    if (!parent) {
      throw new NotFoundCommentError("Parent comment not found");
    }
  }

  // Create comment
  const [comment] = await db
    .insert(commentsTable)
    .values({
      content: sanitizeContent(content || ""),
      imageUrl: trimmedImageUrl,
      mangaId,
      userId: caller.user.id,
      imageIndex: imageIndex ?? null,
      parentId: parentId || null,
    })
    .returning();

  revalidatePath(`/${manga.slug}`);

  return comment;
}

/**
 * Updates an existing comment.
 */
export async function updateComment(
  callerInput: CallerInput,
  input: UpdateCommentInput
) {
  const caller = await resolveCaller(
    callerInput,
    "กรุณาเข้าสู่ระบบก่อนแก้ไขความคิดเห็น"
  );

  const { commentId, content } = input;

  if (!commentId || typeof commentId !== "string" || !commentId.trim()) {
    throw new ValidationCommentError("commentId is required");
  }

  if (!content || typeof content !== "string" || !content.trim()) {
    throw new ValidationCommentError("Content is required");
  }

  if (content.length > 500) {
    throw new ValidationCommentError("ความคิดเห็นต้องไม่เกิน 500 ตัวอักษร");
  }

  const [comment] = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.id, commentId))
    .limit(1);

  if (!comment) {
    throw new NotFoundCommentError("Comment not found");
  }

  if (comment.userId !== caller.user.id) {
    throw new ForbiddenCommentError("You can only edit your own comments");
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

  return updated;
}

/**
 * Deletes a comment. Owners or admins only.
 */
export async function deleteComment(
  callerInput: CallerInput,
  commentId: string
) {
  const caller = await resolveCaller(
    callerInput,
    "กรุณาเข้าสู่ระบบก่อนลบความคิดเห็น"
  );

  if (!commentId || typeof commentId !== "string" || !commentId.trim()) {
    throw new ValidationCommentError("commentId is required");
  }

  const [comment] = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.id, commentId))
    .limit(1);

  if (!comment) {
    throw new NotFoundCommentError("Comment not found");
  }

  if (!caller.canModify(comment.userId)) {
    throw new ForbiddenCommentError(
      "You don't have permission to delete this comment"
    );
  }

  await db.delete(commentsTable).where(eq(commentsTable.id, commentId));

  const mangaSlug = await getMangaSlug(comment.mangaId);
  if (mangaSlug) {
    revalidatePath(`/${mangaSlug}`);
  }

  return { success: true };
}

/**
 * Votes on a comment (upvote: 1, downvote: -1).
 */
export async function voteComment(
  callerInput: CallerInput,
  input: VoteCommentInput
): Promise<CommentVoteResult> {
  const caller = await resolveCaller(
    callerInput,
    "กรุณาเข้าสู่ระบบก่อนโหวต"
  );

  const { commentId, value } = input;

  if (!commentId || typeof commentId !== "string" || !commentId.trim()) {
    throw new ValidationCommentError("commentId is required");
  }

  if (value !== 1 && value !== -1) {
    throw new ValidationCommentError("Vote value must be 1 or -1");
  }

  // Rate limiting: 10 votes per 15 minutes
  const rateLimit = await checkRateLimit(
    `vote:${caller.user.id}`,
    10,
    15 * 60 * 1000
  );

  if (!rateLimit.allowed) {
    const waitMins = rateLimit.resetTime
      ? Math.ceil((rateLimit.resetTime - Date.now()) / 60000)
      : 1;
    throw new RateLimitCommentError(
      `คุณโหวตเร็วเกินไป กรุณารอ ${waitMins} นาที`,
      rateLimit.resetTime,
      waitMins
    );
  }

  const [comment] = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.id, commentId))
    .limit(1);

  if (!comment) {
    throw new NotFoundCommentError("Comment not found");
  }

  const [existingVote] = await db
    .select()
    .from(commentVotesTable)
    .where(
      and(
        eq(commentVotesTable.commentId, commentId),
        eq(commentVotesTable.userId, caller.user.id)
      )
    )
    .limit(1);

  let newVoteScore = comment.voteScore;

  if (existingVote) {
    if (existingVote.value === value) {
      await db
        .delete(commentVotesTable)
        .where(eq(commentVotesTable.id, existingVote.id));
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
      userId: caller.user.id,
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
        eq(commentVotesTable.userId, caller.user.id)
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
}

/**
 * Lists comments with cursor-based pagination and nested replies.
 */
export async function listComments(
  options: ListCommentsOptions
): Promise<CommentListResult> {
  const { mangaId, imageIndex, cursor } = options;
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);

  if (!mangaId || typeof mangaId !== "string" || !mangaId.trim()) {
    throw new ValidationCommentError("mangaId is required");
  }

  const baseConditions = [
    eq(commentsTable.mangaId, mangaId),
    isNull(commentsTable.parentId),
  ];

  if (imageIndex !== undefined && imageIndex !== null) {
    baseConditions.push(eq(commentsTable.imageIndex, imageIndex));
  } else {
    baseConditions.push(isNull(commentsTable.imageIndex));
  }

  if (cursor) {
    const cursorDate = parseCommentCursor(cursor);
    if (cursorDate) {
      baseConditions.push(sql`${commentsTable.createdAt} < ${cursorDate}`);
    }
  }

  const comments = await db.query.comments.findMany({
    where: and(...baseConditions),
    orderBy: [desc(commentsTable.createdAt)],
    limit: limit + 1,
    with: {
      profile: {
        columns: { id: true, name: true, username: true, image: true },
      },
      commentVotes: {
        columns: { userId: true, value: true },
      },
      comments: {
        orderBy: [asc(commentsTable.createdAt)],
        limit: 20,
        with: {
          profile: {
            columns: { id: true, name: true, username: true, image: true },
          },
          commentVotes: {
            columns: { userId: true, value: true },
          },
        },
      },
    },
  });

  const transformed = comments.map((c: any) => ({
    ...c,
    user: c.profile,
    votes: c.commentVotes,
    replies: (c.comments || []).map((r: any) => ({
      ...r,
      user: r.profile,
      votes: r.commentVotes,
    })),
  }));

  let nextCursor: string | null = null;
  if (transformed.length > limit) {
    const nextItem = transformed.pop();
    nextCursor = getNextCommentCursor(nextItem?.createdAt);
  }

  return { comments: transformed, nextCursor };
}
