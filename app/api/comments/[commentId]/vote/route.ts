import { NextResponse } from "next/server";
import { db } from "@/db";
import { commentVotes as commentVotesTable, comments as commentsTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

type RouteParams = {
  params: Promise<{
    commentId: string;
  }>;
};

// POST /api/comments/[commentId]/vote - Vote on a comment
export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: request.headers });
  const { commentId } = await params;
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนโหวต" }, { status: 401 });
  }

  // Rate limiting: 30 votes per 15 minutes per user
  const rateLimit = await checkRateLimit(
    `vote:${session.user.id}`,
    30,
    15 * 60 * 1000
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `คุณโหวตเร็วเกินไป กรุณารอ ${Math.ceil((rateLimit.resetTime! - Date.now()) / 60000)} นาที` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { value } = body;

    if (value !== 1 && value !== -1) {
      return NextResponse.json({ error: "Vote value must be 1 or -1" }, { status: 400 });
    }

    // Check if comment exists
    const [comment] = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.id, commentId))
      .limit(1);
    
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if user already voted
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
        // Same vote = remove vote
        await db.delete(commentVotesTable).where(eq(commentVotesTable.id, existingVote.id));
        newVoteScore -= value;
      } else {
        // Different vote = update vote (swing of 2)
        await db
          .update(commentVotesTable)
          .set({ value })
          .where(eq(commentVotesTable.id, existingVote.id));
        newVoteScore += value * 2;
      }
    } else {
      // New vote
      await db.insert(commentVotesTable).values({
        commentId,
        userId: session.user.id,
        value,
      });
      newVoteScore += value;
    }

    // Update cached vote score on comment
    await db
      .update(commentsTable)
      .set({ voteScore: newVoteScore })
      .where(eq(commentsTable.id, commentId));

    // Get user's current vote
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

    return NextResponse.json({
      voteScore: newVoteScore,
      userVote: userVote?.value ?? null,
    });
  } catch (error) {
    console.error("Error voting on comment:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
