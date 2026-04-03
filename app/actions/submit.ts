"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { manga as mangaTable, mangaSubmissions as submissionsTable, mangaSubmissionTags as submissionTagsTable, userSubmissionLimits as submissionLimitsTable, categories as categoriesTable, tags as tagsTable, authors as authorsTable } from "@/db/schema";
import { eq, sql, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isUserBanned } from "@/lib/session-utils";

// ============================================================================
// Schema Definitions
// ============================================================================

const SubmitMangaSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().optional(),
  description: z.string().max(5000).optional(),
  coverImage: z.string().url("Invalid cover image URL"),
  pages: z
    .array(z.string().url("Invalid page URL"))
    .min(1, "At least one page is required"),
  categoryId: z.string().nullable().optional(),
  authorId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
  status: z.enum(["PENDING"]).optional().default("PENDING"),
});

const CreateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50),
});

// ============================================================================
// Helper Functions
// ============================================================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/[^\w\-\u0E00-\u0E7F]+/g, "")
    .replace(/\-\-+/g, "-");
}

// ============================================================================
// Server Actions
// ============================================================================

export async function submitManga(data: z.input<typeof SubmitMangaSchema>) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { error: "กรุณาเข้าสู่ระบบก่อนส่งผลงาน" };
  }

  if (isUserBanned(session)) {
    return { error: "บัญชีของคุณถูกระงับการใช้งาน" };
  }

  const parsed = SubmitMangaSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };
  }

  const {
    title,
    slug,
    description,
    coverImage,
    pages,
    categoryId,
    authorId,
    tagIds,
    status,
  } = parsed.data;

  try {
    let finalSlug = slug || generateSlug(title);

    // Ensure slug is unique
    const [existingManga] = await db
      .select({ id: mangaTable.id })
      .from(mangaTable)
      .where(eq(mangaTable.slug, finalSlug))
      .limit(1);

    if (existingManga) {
      finalSlug = `${finalSlug}-${Date.now()}`;
    }

    // Check daily submission rate limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [limit] = await db
      .select()
      .from(submissionLimitsTable)
      .where(eq(submissionLimitsTable.userId, session.user.id))
      .limit(1);

    if (limit) {
      const windowStart = new Date(limit.windowStart);
      if (windowStart < today) {
        await db
          .update(submissionLimitsTable)
          .set({ submissionCount: 0, windowStart: new Date().toISOString() })
          .where(eq(submissionLimitsTable.userId, session.user.id));
      } else if (limit.submissionCount >= 5) {
        return {
          error: "Daily submission limit reached (5/5). Please try again tomorrow.",
        };
      }
    } else {
      await db.insert(submissionLimitsTable).values({ userId: session.user.id });
    }

    // Create submission
    const [submission] = await db
      .insert(submissionsTable)
      .values({
        userId: session.user.id,
        title,
        slug: finalSlug,
        description,
        coverImage,
        pages: JSON.stringify(pages),
        categoryId: categoryId || null,
        authorId: authorId || null,
        status,
      })
      .returning();

    // Add tags
    if (tagIds && tagIds.length > 0) {
      await db.insert(submissionTagsTable).values(
        tagIds.map((tagId) => ({ submissionId: submission.id, tagId }))
      );
    }

    // Increment submission count
    await db
      .update(submissionLimitsTable)
      .set({
        submissionCount: sql`${submissionLimitsTable.submissionCount} + 1`,
        lastSubmitAt: new Date().toISOString(),
      })
      .where(eq(submissionLimitsTable.userId, session.user.id));

    revalidatePath("/dashboard/submissions");

    return { success: true, submissionId: submission.id };
  } catch (error) {
    console.error("Submit manga error:", error);
    return { error: "Failed to submit manga" };
  }
}

export async function createCategory(name: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const parsed = CreateCategorySchema.safeParse({ name });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid category name" };
  }

  try {
    const [existing] = await db
      .select()
      .from(categoriesTable)
      .where(ilike(categoriesTable.name, name.trim()))
      .limit(1);

    if (existing) {
      return { category: existing };
    }

    const [category] = await db
      .insert(categoriesTable)
      .values({ name: name.trim() })
      .returning();

    revalidatePath("/dashboard/submit");
    revalidatePath("/");

    return { category };
  } catch (error) {
    console.error("Create category error:", error);
    return { error: "Failed to create category" };
  }
}

export async function createTag(name: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (!name || name.trim().length === 0) {
    return { error: "Tag name is required" };
  }

  try {
    const [existing] = await db
      .select()
      .from(tagsTable)
      .where(ilike(tagsTable.name, name.trim()))
      .limit(1);

    if (existing) {
      return { tag: existing };
    }

    const [tag] = await db
      .insert(tagsTable)
      .values({ name: name.trim() })
      .returning();

    revalidatePath("/dashboard/submit");
    revalidatePath("/");

    return { tag };
  } catch (error) {
    console.error("Create tag error:", error);
    return { error: "Failed to create tag" };
  }
}

export async function createAuthor(name: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (!name || name.trim().length === 0) {
    return { error: "Author name is required" };
  }

  try {
    const [existing] = await db
      .select()
      .from(authorsTable)
      .where(ilike(authorsTable.name, name.trim()))
      .limit(1);

    if (existing) {
      return { author: existing };
    }

    const [author] = await db
      .insert(authorsTable)
      .values({ name: name.trim() })
      .returning();

    revalidatePath("/dashboard/submit");

    return { author };
  } catch (error) {
    console.error("Create author error:", error);
    return { error: "Failed to create author" };
  }
}
