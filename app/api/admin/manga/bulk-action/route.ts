import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { manga } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { removeMangaWithComments } from "@/lib/comments/manga-removal";
import { requireModerationAdmin } from "@/lib/comments/moderation";
import { handleCommentError } from "@/lib/comments";
import { bulkMangaSchema } from "@/lib/manga-input";
import { invalidateMangaContent } from "@/lib/manga-invalidation";
export async function POST(req: NextRequest) {
  try {
    await requireModerationAdmin(req, true);
    const parsed = bulkMangaSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid action or manga IDs (maximum 200)" }, { status: 400 });
    const { ids, action } = parsed.data;
    const before = await db.select({ id: manga.id, slug: manga.slug }).from(manga).where(inArray(manga.id, ids));
    const changed = action === "delete" ? await removeMangaWithComments(ids) : await db.update(manga).set({ isHidden: action === "hide" }).where(inArray(manga.id, ids)).returning({ id: manga.id });
    const refreshed = invalidateMangaContent(before.map(row => row.slug));
    return NextResponse.json({ success: true, cache_refresh_pending: !refreshed, action, count: changed.length, ids: changed.map(row => row.id) });
  } catch (error) { return handleCommentError(error); }
}
