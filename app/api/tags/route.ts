import { escapeLike } from "@/lib/admin-pagination";
import { ilike, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { tags as tagsTable } from "@/db/schema";
import { asc } from "drizzle-orm";
import { authenticateRequest } from "@/lib/auth-helpers";
import { invalidateMangaContent } from "@/lib/manga-invalidation";
import { sanitizeInput } from "@/lib/sanitize";

// GET all tags
export async function GET(request?: Request) {
  const params = request
    ? new URL(request.url).searchParams
    : new URLSearchParams();
  if (params.has("limit")) {
    const selected = (params.get("selected") ?? "")
      .split(",")
      .filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
      .slice(0, 50);
    const search = (params.get("search") ?? "").trim().slice(0, 120);
    const rows = await db.query.tags.findMany({
      where: search
        ? ilike(tagsTable.name, `%${escapeLike(search)}%`)
        : undefined,
      orderBy: [asc(tagsTable.name), asc(tagsTable.id)],
      limit: 20,
    });
    const missing = selected.filter((id) => !rows.some((row) => row.id === id));
    const extra = missing.length
      ? await db.query.tags.findMany({ where: inArray(tagsTable.id, missing) })
      : [];
    return NextResponse.json([...rows, ...extra], {
      headers: { "Cache-Control": "no-store" },
    });
  }
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
  const sanitizedName =
    typeof name === "string" ? sanitizeInput(name).trim() : "";

  if (!sanitizedName || sanitizedName.length > 100) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const [newTag] = await db
      .insert(tagsTable)
      .values({ name: sanitizedName })
      .returning();
    const cacheRefreshed = invalidateMangaContent();
    return NextResponse.json(
      { ...newTag, cache_refresh_pending: !cacheRefreshed },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Tag already exists" }, { status: 409 });
  }
}
