import { NextResponse } from "next/server";
import { db } from "@/db";
import { authors as authorsTable } from "@/db/schema";
import { asc } from "drizzle-orm";
import { authenticateRequest } from "@/lib/auth-helpers";
import { invalidateMangaContent } from "@/lib/manga-invalidation";
import { sanitizeInput } from "@/lib/sanitize";

// GET all authors
export async function GET() {
  const authors = await db.query.authors.findMany({
    orderBy: [asc(authorsTable.name)],
  });
  return NextResponse.json(authors);
}

// POST a new author
export async function POST(request: Request) {
  const authorization = await authenticateRequest(request);
  if (!authorization.ok) return authorization.response;

  const { name, profileUrl, socialLinks } = await request.json().catch(() => ({}));
  const sanitizedName = typeof name === "string" ? sanitizeInput(name).trim() : "";

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
    return NextResponse.json({ ...newAuthor, cache_refresh_pending: !cacheRefreshed }, { status: 201 });
  } catch (error: any) {
    // Handle unique constraint violation (Postgres error code 23505)
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Author already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create author" },
      { status: 500 }
    );
  }
}
