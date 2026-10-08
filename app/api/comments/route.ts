import { NextResponse } from "next/server";
import { readCommentJson } from "@/lib/comments/request";
import { listComments, createComment, handleCommentError, ValidationCommentError, type CreateCommentInput } from "@/lib/comments";

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
      imageIndexParam !== null ? Number(imageIndexParam) : null;
    const limit = limitParam ? Number(limitParam) : 20;

    const result = await listComments({
      mangaId,
      imageIndex,
      cursor,
      limit,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleCommentError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readCommentJson(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new ValidationCommentError("ข้อมูลไม่ถูกต้อง");
    // The domain validates every field, including IDs, ownership, content and page scope.
    const comment = await createComment(request,body as CreateCommentInput);
    return NextResponse.json({comment},{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) { return handleCommentError(error); }
}
