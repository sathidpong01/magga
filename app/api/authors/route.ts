import { escapeLike } from "@/lib/admin-pagination";
import { ilike, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { authors as authorsTable } from "@/db/schema";
import { asc } from "drizzle-orm";
import { authenticateRequest } from "@/lib/auth-helpers";
import { invalidateMangaContent } from "@/lib/manga-invalidation";
import { sanitizeInput } from "@/lib/sanitize";

// GET all authors
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
    const rows = await db.query.authors.findMany({
      where: search
        ? ilike(authorsTable.name, `%${escapeLike(search)}%`)
        : undefined,
      orderBy: [asc(authorsTable.name), asc(authorsTable.id)],
      limit: 20,
    });
    const missing = selected.filter((id) => !rows.some((row) => row.id === id));
    const extra = missing.length
      ? await db.query.authors.findMany({
          where: inArray(authorsTable.id, missing),
        })
      : [];
    return NextResponse.json([...rows, ...extra], {
      headers: { "Cache-Control": "no-store" },
    });
  }
  const authors = await db.query.authors.findMany({
    orderBy: [asc(authorsTable.name)],
  });
  return NextResponse.json(authors);
}

// POST a new author
export async function POST(request: Request) {
  const authorization = await authenticateRequest(request);
  if (!authorization.ok) return authorization.response;

  const { name, profileUrl, socialLinks } = await request
    .json()
    .catch(() => ({}));
  const sanitizedName =
    typeof name === "string" ? sanitizeInput(name).trim() : "";

  if (!sanitizedName || sanitizedName.length > 100) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const [newAuthor] = await db
      .insert(authorsTable)
      .values({
        name: sanitizedName,
        profileUrl: profileUrl || null,
        socialLinks: socialLinks || null,
      })
      .returning();
    const cacheRefreshed = invalidateMangaContent();
    return NextResponse.json(
      { ...newAuthor, cache_refresh_pending: !cacheRefreshed },
      { status: 201 },
    );
  } catch (error: any) {
    // Handle unique constraint violation (Postgres error code 23505)
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Author already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create author" },
      { status: 500 },
    );
  }
}
