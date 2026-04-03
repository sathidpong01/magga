import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { manga as mangaTable, mangaTags as mangaTagsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { z } from "zod";

const mangaSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  authorId: z.string().nullable().optional(),
  selectedTags: z.array(z.string()),
  coverImage: z.string().url().optional(),
  pages: z.array(z.string().url()).optional(),
  isHidden: z.boolean().optional(),
  authorName: z.string().nullish(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = mangaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      categoryId,
      authorId,
      selectedTags,
      coverImage,
      pages,
      isHidden,
      authorName,
      slug,
    } = result.data;

    // Check if slug exists
    const [existingSlug] = await db
      .select({ id: mangaTable.id })
      .from(mangaTable)
      .where(eq(mangaTable.slug, slug))
      .limit(1);

    if (existingSlug) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }

    // Create manga
    const [newManga] = await db
      .insert(mangaTable)
      .values({
        title,
        slug,
        description,
        categoryId: categoryId || null,
        authorId: authorId || null,
        coverImage: coverImage || "https://via.placeholder.com/300x400.png?text=Cover",
        pages: JSON.stringify(pages || []),
        isHidden: isHidden || false,
        authorName: authorName || null,
      })
      .returning();

    // Add tags if any
    if (selectedTags.length > 0) {
      await db.insert(mangaTagsTable).values(
        selectedTags.map((tagId) => ({
          mangaId: newManga.id,
          tagId,
        }))
      );
    }

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/manga");
    revalidatePath("/");
    return NextResponse.json(newManga, { status: 201 });
  } catch (error) {
    console.error("Error creating manga:", error);
    return NextResponse.json(
      { error: "Failed to create manga" },
      { status: 500 }
    );
  }
}
