import { escapeLike } from "@/lib/admin-pagination";
import { ilike, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories as categoriesTable } from "@/db/schema";
import { asc } from "drizzle-orm";
import { authenticateRequest } from "@/lib/auth-helpers";
import { invalidateMangaContent } from "@/lib/manga-invalidation";
import { sanitizeInput } from "@/lib/sanitize";

// GET all categories
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
    const rows = await db.query.categories.findMany({
      where: search
        ? ilike(categoriesTable.name, `%${escapeLike(search)}%`)
        : undefined,
      orderBy: [asc(categoriesTable.name), asc(categoriesTable.id)],
      limit: 20,
    });
    const missing = selected.filter((id) => !rows.some((row) => row.id === id));
    const extra = missing.length
      ? await db.query.categories.findMany({
          where: inArray(categoriesTable.id, missing),
        })
      : [];
    return NextResponse.json([...rows, ...extra], {
      headers: { "Cache-Control": "no-store" },
    });
  }
  const categories = await db.query.categories.findMany({
    orderBy: [asc(categoriesTable.name)],
  });
  return NextResponse.json(categories);
}

// POST a new category
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
    const [newCategory] = await db
      .insert(categoriesTable)
      .values({ name: sanitizedName })
      .returning();
    const cacheRefreshed = invalidateMangaContent();
    return NextResponse.json(
      { ...newCategory, cache_refresh_pending: !cacheRefreshed },
      { status: 201 },
    );
  } catch {
    // Handle potential errors, e.g., unique constraint violation
    return NextResponse.json(
      { error: "Category already exists" },
      { status: 409 },
    );
  }
}
