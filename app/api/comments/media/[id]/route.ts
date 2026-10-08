import { readPublishedCommentAsset } from "@/lib/comments/assets";
import { requireUuid } from "@/lib/comments/validation";
import { handleCommentError } from "@/lib/comments";

export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    // Compatibility only: new comments already contain a direct R2 image URL.
    // This route never downloads or proxies image bytes through Vercel.
    const url = await readPublishedCommentAsset(requireUuid(id, "id"), request.headers);
    return new Response(null, { status: 307, headers: { Location: url, "Cache-Control": "private, no-store" } });
  } catch (error) { return handleCommentError(error); }
}
