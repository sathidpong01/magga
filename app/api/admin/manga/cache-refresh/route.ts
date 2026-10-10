import { NextResponse } from "next/server";
import { requireModerationAdmin } from "@/lib/comments/moderation";
import { handleCommentError } from "@/lib/comments";
import { invalidateMangaContent } from "@/lib/manga-invalidation";

/** Retry cache invalidation only; never replay a content mutation. */
export async function POST(request: Request) {
  try {
    // Fresh admin profile, same-origin request and the existing admin operation quota.
    await requireModerationAdmin(request, true);
    const refreshed = invalidateMangaContent();
    return NextResponse.json({ success: refreshed, cache_refresh_pending: !refreshed }, {
      status: refreshed ? 200 : 503,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) { return handleCommentError(error); }
}
