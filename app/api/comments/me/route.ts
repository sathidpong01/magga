import { NextResponse } from "next/server";
import { getCommentCapabilities, handleCommentError } from "@/lib/comments";

export async function GET(request:Request) {
  try {
    const search = new URL(request.url).searchParams;
    const ids = search.get("ids")?.split(",").filter(Boolean) || [];
    const mangaId = search.get("mangaId");
    const rawIndex = search.get("imageIndex");
    const scope = mangaId ? {mangaId,imageIndex:rawIndex === null ? null : Number(rawIndex)} : undefined;
    return NextResponse.json(await getCommentCapabilities(request.headers,ids,scope),{headers:{"Cache-Control":"private, no-store"}});
  } catch(error) { return handleCommentError(error); }
}
