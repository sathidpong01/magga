import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { comments as commentsTable, manga as mangaTable } from "@/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 20;
    const offset = (page - 1) * limit;

    const rows = await db.query.comments.findMany({
      where: and(
        eq(commentsTable.userId, session.user.id),
        isNull(commentsTable.parentId),
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

    return NextResponse.json({ comments: rows, hasMore, page });
  } catch (error) {
    console.error("my-comments error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
