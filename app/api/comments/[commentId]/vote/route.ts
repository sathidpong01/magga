import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

type RouteParams = {
  params: Promise<{
    commentId: string;
  }>;
};

// POST /api/comments/[commentId]/vote - Vote on a comment
export async function POST(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  const { commentId } = await params;
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนโหวต" }, { status: 401 });
  }

  // Rate limiting: 30 votes per 15 minutes per user
  const rateLimit = await checkRateLimit(
    `vote:${session.user.id}`,
    30, // max 30 votes
    15 * 60 * 1000 // per 15 minutes
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

    // Validate vote value
    if (value !== 1 && value !== -1) {
      return NextResponse.json({ error: "Vote value must be 1 or -1" }, { status: 400 });
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if user already voted
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
        // Different vote = update vote (swing of 2)
        await prisma.commentVote.update({
          where: { id: existingVote.id },
          data: { value },
        });
        newVoteScore += value * 2; // e.g., from -1 to +1 = +2
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

    // Update cached vote score on comment
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

    return NextResponse.json({
      voteScore: newVoteScore,
      userVote: userVote?.value ?? null,
    });
  } catch (error) {
    console.error("Error voting on comment:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
