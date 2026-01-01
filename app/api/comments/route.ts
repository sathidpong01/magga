import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        votes: {
          select: {
            userId: true,
            value: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
            votes: {
              select: {
                userId: true,
                value: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
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

    return NextResponse.json({ comments, nextCursor });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// NOTE: POST /api/comments is now handled by createComment Server Action in app/actions/comments.ts
