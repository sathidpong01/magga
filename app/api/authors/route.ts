import { NextResponse } from "next/server";
import { db } from "@/db";
import { authors as authorsTable } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-helpers";
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
  const session = await auth.api.getSession({ headers: request.headers });
  const authError = requireAuth(session); // Allow authenticated users to create authors
  if (authError) return authError;

  const { name, profileUrl, socialLinks } = await request.json();
  const sanitizedName = sanitizeInput(name);

  if (!sanitizedName || sanitizedName.length === 0) {
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
    revalidatePath("/dashboard/admin/authors");
    revalidatePath("/dashboard/submit");
    return NextResponse.json(newAuthor, { status: 201 });
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
