import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { manga as mangaTable } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { removeMangaWithComments } from "@/lib/comments/manga-removal";
import { requireModerationAdmin } from "@/lib/comments/moderation";
import { handleCommentError } from "@/lib/comments";

export async function POST(req: NextRequest) {
  try {
    await requireModerationAdmin(req,true);

    const body = await req.json();
    const { ids, action } = body as {
      ids: string[];
      action: "delete" | "show" | "hide";
    };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No manga IDs provided" },
        { status: 400 }
      );
    }

    if (!["delete", "show", "hide"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    let count = 0;

    switch (action) {
      case "delete":
        const deleted = await removeMangaWithComments(ids);
        count = deleted.length;
        break;
      case "show":
        const shown = await db
          .update(mangaTable)
          .set({ isHidden: false })
          .where(inArray(mangaTable.id, ids))
          .returning({ id: mangaTable.id });
        count = shown.length;
        break;
      case "hide":
        const hidden = await db
          .update(mangaTable)
          .set({ isHidden: true })
          .where(inArray(mangaTable.id, ids))
          .returning({ id: mangaTable.id });
        count = hidden.length;
        break;
    }

    return NextResponse.json({
      success: true,
      action,
      count,
    });
  } catch (error) {
    return handleCommentError(error);
  }
}
