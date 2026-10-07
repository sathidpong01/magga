import { NextResponse } from "next/server";
import { listCommentReplies, handleCommentError } from "@/lib/comments";

export async function GET(request:Request,{params}:{params:Promise<{commentId:string}>}) {
  try {
    const {commentId} = await params;
    const search = new URL(request.url).searchParams;
    const rawLimit = search.get("limit");
    const result = await listCommentReplies({commentId,cursor:search.get("cursor"),limit:rawLimit === null ? 20 : Number(rawLimit)});
    return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return handleCommentError(error); }
}
