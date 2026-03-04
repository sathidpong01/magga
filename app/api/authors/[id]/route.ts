import { NextResponse } from "next/server";
import { db } from "@/db";
import { authors as authorsTable, manga as mangaTable } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// GET a single author
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const author = await db.query.authors.findFirst({
      where: eq(authorsTable.id, id),
    });

    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    // Count mangas by this author
    const [{ mangaCount }] = await db
      .select({ mangaCount: count() })
      .from(mangaTable)
      .where(eq(mangaTable.authorId, id));

    return NextResponse.json({ ...author, _count: { mangas: Number(mangaCount) } });
  } catch {
    return NextResponse.json({ error: "Failed to fetch author" }, { status: 500 });
  }
}

// PUT to update an author (admin only)
export async function PUT(request: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || (session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, profileUrl, socialLinks } = await request.json();
  const { id } = await params;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const [updatedAuthor] = await db
      .update(authorsTable)
      .set({
        name: name.trim(),
        profileUrl: profileUrl ?? null,
        socialLinks: socialLinks ?? null,
      })
      .where(eq(authorsTable.id, id))
      .returning();

    revalidatePath("/admin/categories");
    return NextResponse.json(updatedAuthor);
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Author name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update author" }, { status: 500 });
  }
}

// DELETE an author (admin only)
export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || (session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await db.delete(authorsTable).where(eq(authorsTable.id, id));
    revalidatePath("/admin/categories");
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete author. It might be in use." },
      { status: 500 }
    );
  }
}
