import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { cleanupCommentAssets } from "@/lib/comments/assets";
import { handleCommentError } from "@/lib/comments";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || provided.length !== expected.length || !timingSafeEqual(provided, expected)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json(await cleanupCommentAssets(), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return handleCommentError(error); }
}
