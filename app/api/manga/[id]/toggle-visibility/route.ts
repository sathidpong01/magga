import { NextResponse } from "next/server";
import { db } from "@/db";
import { manga } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authenticateRequest } from "@/lib/auth-helpers";
import { invalidateMangaContent } from "@/lib/manga-invalidation";
import { z } from "zod";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request, { role: "admin" });
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const parsed = z.object({ isHidden: z.boolean() }).safeParse(await request.json().catch(() => null));
  if (!z.uuid().safeParse(id).success || !parsed.success) return NextResponse.json({ error: "ID and target visibility are required" }, { status: 400 });
  const [updated] = await db.update(manga).set({ isHidden: parsed.data.isHidden }).where(eq(manga.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Manga not found" }, { status: 404 });
  const refreshed = invalidateMangaContent([updated.slug]);
  return NextResponse.json({ ...updated, cache_refresh_pending: !refreshed });
}
