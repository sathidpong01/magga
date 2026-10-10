import { NextResponse } from "next/server";
import { db } from "@/db";
import { tags as tagsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authenticateRequest } from "@/lib/auth-helpers";
import { invalidateMangaContent } from "@/lib/manga-invalidation";
import { UUID_PATTERN } from "@/lib/manga-query";
import { sanitizeInput } from "@/lib/sanitize";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// PUT to update a tag
export async function PUT(request: Request, { params }: RouteParams) {
  const authorization = await authenticateRequest(request, { role: "admin" });
  if (!authorization.ok) return authorization.response;
  
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? sanitizeInput(body.name).trim() : "";
  const { id } = await params;

  if (!name || name.length > 100 || !UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const [updatedTag] = await db.update(tagsTable)
      .set({ name })
      .where(eq(tagsTable.id, id))
      .returning();
    if (!updatedTag) return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    const cacheRefreshed = invalidateMangaContent();
    return NextResponse.json({ ...updatedTag, cache_refresh_pending: !cacheRefreshed });
  } catch {
    return NextResponse.json(
      { error: "Failed to update tag" },
      { status: 500 }
    );
  }
}

// DELETE a tag
export async function DELETE(request: Request, { params }: RouteParams) {
  const authorization = await authenticateRequest(request, { role: "admin" });
  if (!authorization.ok) return authorization.response;
  
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: "Invalid identifier" }, { status: 400 });
  
  try {
    await db.delete(tagsTable).where(eq(tagsTable.id, id));
    const cacheRefreshed = invalidateMangaContent();
    return new NextResponse(null, { status: 204, headers: cacheRefreshed ? {} : { "X-Magga-Cache-Refresh": "pending" } }); // No Content
  } catch {
    return NextResponse.json(
      { error: "Failed to delete tag. It might be in use." },
      { status: 500 }
    );
  }
}
