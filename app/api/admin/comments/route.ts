import { NextResponse } from "next/server";
import { db } from "@/db";
import { comments as commentsTable, commentVotes as commentVotesTable, profiles as profilesTable, manga as mangaTable } from "@/db/schema";
import { eq, ilike, or, desc, asc, count, inArray, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-helpers";

function parsePageParam(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(1, parsed));
}

// GET /api/admin/comments - Fetch all comments for admin
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const authError = requireAdmin(session);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const page = parsePageParam(searchParams.get("page"), 1, Number.MAX_SAFE_INTEGER);
  const limit = parsePageParam(searchParams.get("limit"), 20, 100);
  const search = searchParams.get("search")?.trim() || "";

  const allowedSortFields: Record<string, any> = {
    createdAt: commentsTable.createdAt,
    voteScore: commentsTable.voteScore,
  };
  const sortByField = allowedSortFields[searchParams.get("sortBy") || ""] || commentsTable.createdAt;
  const sortOrder = searchParams.get("sortOrder") === "asc" ? asc : desc;
  const searchPattern = `%${search}%`;
  const where = search
    ? or(
        ilike(commentsTable.content, searchPattern),
        sql`exists (
          select 1 from ${profilesTable}
          where ${profilesTable.id} = ${commentsTable.userId}
          and (
            ${profilesTable.name} ilike ${searchPattern}
            or ${profilesTable.username} ilike ${searchPattern}
          )
        )`,
        sql`exists (
          select 1 from ${mangaTable}
          where ${mangaTable.id} = ${commentsTable.mangaId}
          and ${mangaTable.title} ilike ${searchPattern}
        )`
      )
    : undefined;

  try {
    const comments = await db.query.comments.findMany({
      where,
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

    const [{ total }] = await db
      .select({ total: count() })
      .from(commentsTable)
      .where(where);

    const totalNum = Number(total);

    return NextResponse.json({
      comments: comments.map((c) => ({
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
