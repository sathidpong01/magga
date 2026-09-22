import { NextResponse } from "next/server";
import { listComments, handleCommentError } from "@/lib/comments";

// GET /api/comments - Fetch comments for a manga (with pagination)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mangaId = searchParams.get("mangaId");
  const imageIndexParam = searchParams.get("imageIndex");
  const cursor = searchParams.get("cursor");
  const limitParam = searchParams.get("limit");

  if (!mangaId) {
    return NextResponse.json({ error: "mangaId is required" }, { status: 400 });
  }

  try {
    const imageIndex =
      imageIndexParam !== null ? parseInt(imageIndexParam, 10) : null;
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    const result = await listComments({
      mangaId,
      imageIndex: Number.isNaN(imageIndex) ? null : imageIndex,
      cursor,
      limit,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    return handleCommentError(error);
  }
}
