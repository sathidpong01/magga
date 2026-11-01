import { timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import { invalidateMangaContent } from "@/lib/manga-invalidation";
import { publishScheduledManga } from "@/lib/manga-publication";

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization") ?? "";
  const token = `Bearer ${expected}`;
  if (!expected || Buffer.byteLength(supplied) !== Buffer.byteLength(token) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(token)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await publishScheduledManga(db, invalidateMangaContent);
    return Response.json(result, { status: result.cacheRefreshPending ? 503 : 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Scheduled manga publication failed", error);
    return Response.json({ error: "Publication failed; next run will retry" }, { status: 500 });
  }
}
