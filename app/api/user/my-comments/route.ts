import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helpers";
import { db } from "@/db";
import { comments as commentsTable, manga as mangaTable } from "@/db/schema";
import { eq, desc, and, isNull, inArray } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const authorization = await authenticateRequest(req, { fresh: true });
    if (!authorization.ok) return authorization.response;
    const { caller } = authorization;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 20;
    const offset = (page - 1) * limit;

    const rows = await db.query.comments.findMany({
      where: and(
        eq(commentsTable.userId, caller.user.id),
        isNull(commentsTable.parentId),
        caller.user.role === "admin" ? undefined : inArray(commentsTable.mangaId,
          db.select({ id: mangaTable.id }).from(mangaTable).where(eq(mangaTable.isHidden, false))),
      ),
      orderBy: [desc(commentsTable.createdAt)],
      limit,
      offset,
      columns: {
        id: true,
        content: true,
        imageUrl: true,
        voteScore: true,
        createdAt: true,
        mangaId: true,
        imageIndex: true,
      },
      with: {
        manga: {
          columns: { id: true, title: true, slug: true, coverImage: true },
        },
      },
    });

    const hasMore = rows.length === limit;

    return NextResponse.json({ comments: rows, hasMore, page }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("my-comments error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
