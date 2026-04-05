import { NextResponse } from "next/server";
import { db } from "@/db";
import { comments as commentsTable, commentVotes as commentVotesTable, profiles as profilesTable, manga as mangaTable } from "@/db/schema";
import { eq, isNull, and, desc, asc, sql } from "drizzle-orm";

// GET /api/comments - Fetch comments for a manga (with pagination)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mangaId = searchParams.get("mangaId");
  const imageIndexParam = searchParams.get("imageIndex");
  const cursor = searchParams.get("cursor"); // For pagination
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  if (!mangaId) {
    return NextResponse.json({ error: "mangaId is required" }, { status: 400 });
  }

  try {
    // Build where conditions for top-level comments
    const baseConditions = [
      eq(commentsTable.mangaId, mangaId),
      isNull(commentsTable.parentId),
    ];

    if (imageIndexParam !== null) {
      const imageIndexNum = parseInt(imageIndexParam, 10);
      if (!Number.isNaN(imageIndexNum)) {
        baseConditions.push(eq(commentsTable.imageIndex, imageIndexNum));
      }
    } else {
      baseConditions.push(isNull(commentsTable.imageIndex));
    }

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
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
          // replies
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

    // Transform to match expected format
    const transformed = comments.map((c) => ({
      ...c,
      user: c.profile,
      votes: c.commentVotes,
      replies: c.comments.map((r: any) => ({
        ...r,
        user: r.profile,
        votes: r.commentVotes,
      })),
    }));

    // Check if there's more data
    let nextCursor: string | null = null;
    if (transformed.length > limit) {
      const nextItem = transformed.pop();
      nextCursor = nextItem?.id ?? null;
    }

    return NextResponse.json({ comments: transformed, nextCursor }, {
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
