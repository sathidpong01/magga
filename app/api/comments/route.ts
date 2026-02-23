import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const userSelect = {
  id: true,
  name: true,
  username: true,
  image: true,
} as const;

const voteSelect = {
  userId: true,
  value: true,
} as const;

// GET /api/comments - Fetch comments for a manga (with pagination)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mangaId = searchParams.get("mangaId");
  const imageIndex = searchParams.get("imageIndex");
  const cursor = searchParams.get("cursor"); // For pagination
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50); // Default 20, max 50

  if (!mangaId) {
    return NextResponse.json({ error: "mangaId is required" }, { status: 400 });
  }

  try {
    const comments = await prisma.comment.findMany({
      take: limit + 1, // Fetch extra to check if more exist
      ...(cursor && { cursor: { id: cursor }, skip: 1 }), // Skip cursor itself
      where: {
        mangaId,
        imageIndex: imageIndex !== null ? parseInt(imageIndex) : null,
        parentId: null, // Only top-level comments
      },
      select: {
        id: true,
        content: true,
        imageIndex: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        mangaId: true,
        parentId: true,
        user: { select: userSelect },
        votes: { select: voteSelect },
        replies: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            userId: true,
            mangaId: true,
            parentId: true,
            imageIndex: true,
            user: { select: userSelect },
            votes: { select: voteSelect },
          },
          orderBy: { createdAt: "asc" },
          take: 20, // Limit replies depth
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Check if there's more data
    let nextCursor: string | null = null;
    if (comments.length > limit) {
      const nextItem = comments.pop(); // Remove extra item
      nextCursor = nextItem?.id ?? null;
    }

    return NextResponse.json({ comments, nextCursor }, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// NOTE: POST /api/comments is now handled by createComment Server Action in app/actions/comments.ts
