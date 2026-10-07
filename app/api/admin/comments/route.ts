import { NextResponse } from "next/server";
import { db } from "@/db";
import { comments as commentsTable, profiles as profilesTable, manga as mangaTable } from "@/db/schema";
import { eq, ilike, or, desc, asc, count, sql, and } from "drizzle-orm";
import { requireModerationAdmin, moderateComments } from "@/lib/comments/moderation";
import { handleCommentError } from "@/lib/comments";
import { readCommentJson } from "@/lib/comments/request";
import { decorateCommentImagePreviews } from "@/lib/comments/assets";


function parsePageParam(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(1, parsed));
}

// GET /api/admin/comments - Fetch all comments for admin
export async function GET(request: Request) {
  try { await requireModerationAdmin(request); } catch(error) { return handleCommentError(error); }

  const { searchParams } = new URL(request.url);
  const page = parsePageParam(searchParams.get("page"), 1, Number.MAX_SAFE_INTEGER);
  const limit = parsePageParam(searchParams.get("limit"), 20, 100);
  const search = searchParams.get("search")?.trim() || "";

  const allowedSortFields = {
    createdAt: commentsTable.createdAt,
    voteScore: commentsTable.voteScore,
  };
  const sortByField = allowedSortFields[searchParams.get("sortBy") as keyof typeof allowedSortFields] || commentsTable.createdAt;
  const sortOrder = searchParams.get("sortOrder") === "asc" ? asc : desc;
  const searchPattern = `%${search}%`;
  const searchWhere = search
    ? or(
        ilike(commentsTable.content, searchPattern),
        ilike(commentsTable.authorName, searchPattern),
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

  const requestedStatus = searchParams.get("status");
  const validStatus = ["published", "pending", "hidden", "deleted"].includes(requestedStatus || "") ? requestedStatus as "published" | "pending" | "hidden" | "deleted" : null;
  const where = and(searchWhere, validStatus ? eq(commentsTable.status, validStatus) : undefined);
  try {
    const comments = await db.query.comments.findMany({
      where,
      orderBy: [sortOrder(sortByField)],
      offset: (page - 1) * limit,
      limit,
      with: {
        guest: { columns: { isBanned: true } },
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
      comments: await decorateCommentImagePreviews(comments.map((c) => ({
        ...c,
        guestIsBanned: c.guest?.isBanned ?? false,
        user: c.profile || { id: "", name: c.authorName, username: null, image: null },
        parent: c.comment
          ? {
              ...c.comment,
              user: c.comment.profile,
            }
          : null,
      }))),
      pagination: {
        page,
        limit,
        total: totalNum,
        totalPages: Math.ceil(totalNum / limit),
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// Removal keeps replies and moderation history intact.
export async function DELETE(request: Request) {
  try { const body = await readCommentJson(request); return NextResponse.json(await moderateComments(request, { ...(body as Record<string, unknown>), action: 'delete' }), { headers: { 'Cache-Control': 'private, no-store' } }); }
  catch (error) { return handleCommentError(error); }
}
export async function PATCH(request: Request) {
  try { return NextResponse.json(await moderateComments(request, await readCommentJson(request)), { headers: { 'Cache-Control': 'private, no-store' } }); }
  catch (error) { return handleCommentError(error); }
}
