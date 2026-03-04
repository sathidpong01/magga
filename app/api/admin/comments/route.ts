import { NextResponse } from "next/server";
import { db } from "@/db";
import { comments as commentsTable, commentVotes as commentVotesTable, profiles as profilesTable, manga as mangaTable } from "@/db/schema";
import { eq, and, ilike, or, desc, asc, count, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-helpers";

// GET /api/admin/comments - Fetch all comments for admin
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const authError = requireAdmin(session);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "20"))
  );
  const search = searchParams.get("search") || "";

  const allowedSortFields: Record<string, any> = {
    createdAt: commentsTable.createdAt,
    voteScore: commentsTable.voteScore,
  };
  const sortByField = allowedSortFields[searchParams.get("sortBy") || ""] || commentsTable.createdAt;
  const sortOrder = searchParams.get("sortOrder") === "asc" ? asc : desc;

  try {
    const comments = await db.query.comments.findMany({
      orderBy: [sortOrder(sortByField)],
      offset: (page - 1) * limit,
      limit,
      with: {
        profile: {
          columns: { id: true, name: true, username: true, image: true },
        },
        manga: {
          columns: { id: true, title: true, slug: true },
        },
        comment: {
          // parent comment
          columns: { id: true, content: true },
          with: {
            profile: {
              columns: { name: true, username: true },
            },
          },
        },
      },
    });

    // Filter by search in memory if needed
    const filtered = search
      ? comments.filter(
          (c) =>
            c.content.toLowerCase().includes(search.toLowerCase()) ||
            (c.profile as any)?.name?.toLowerCase().includes(search.toLowerCase()) ||
            (c.profile as any)?.username?.toLowerCase().includes(search.toLowerCase()) ||
            (c.manga as any)?.title?.toLowerCase().includes(search.toLowerCase())
        )
      : comments;

    const [{ total }] = await db
      .select({ total: count() })
      .from(commentsTable);

    const totalNum = Number(total);

    return NextResponse.json({
      comments: filtered.map((c) => ({
        ...c,
        user: c.profile,
        parent: c.comment
          ? {
              ...c.comment,
              user: (c.comment as any).profile,
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        total: totalNum,
        totalPages: Math.ceil(totalNum / limit),
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

// DELETE /api/admin/comments - Bulk delete comments
export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = (session.user as { role?: string }).role;
  if (userRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { commentIds } = body;

    if (!Array.isArray(commentIds) || commentIds.length === 0) {
      return NextResponse.json(
        { error: "commentIds array is required" },
        { status: 400 }
      );
    }

    // Delete votes first (foreign key constraint)
    await db
      .delete(commentVotesTable)
      .where(inArray(commentVotesTable.commentId, commentIds));

    // Delete replies
    await db
      .delete(commentsTable)
      .where(inArray(commentsTable.parentId, commentIds));

    // Delete comments
    const deleted = await db
      .delete(commentsTable)
      .where(inArray(commentsTable.id, commentIds))
      .returning({ id: commentsTable.id });

    return NextResponse.json({ deleted: deleted.length });
  } catch (error) {
    console.error("Error deleting comments:", error);
    return NextResponse.json(
      { error: "Failed to delete comments" },
      { status: 500 }
    );
  }
}
