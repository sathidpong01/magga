import { NextResponse } from "next/server";
import { db } from "@/db";
import { tags as tagsTable } from "@/db/schema";
import { asc } from "drizzle-orm";
import { authenticateRequest } from "@/lib/auth-helpers";
import { invalidateMangaContent } from "@/lib/manga-invalidation";
import { sanitizeInput } from "@/lib/sanitize";

// GET all tags
export async function GET() {
  const tags = await db.query.tags.findMany({
    orderBy: [asc(tagsTable.name)],
  });
  return NextResponse.json(tags);
}

// POST a new tag
export async function POST(request: Request) {
  const authorization = await authenticateRequest(request, { role: "admin" });
  if (!authorization.ok) return authorization.response;

  const { name } = await request.json().catch(() => ({}));
  const sanitizedName = typeof name === "string" ? sanitizeInput(name).trim() : "";

  if (!sanitizedName || sanitizedName.length > 100) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const [newTag] = await db.insert(tagsTable)
      .values({ name: sanitizedName })
      .returning();
    const cacheRefreshed = invalidateMangaContent();
    return NextResponse.json({ ...newTag, cache_refresh_pending: !cacheRefreshed }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Tag already exists" }, { status: 409 });
  }
}
