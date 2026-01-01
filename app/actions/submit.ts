"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
  tagIds: z.array(z.string()).optional(),
  authorCredits: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING"]).optional().default("PENDING"),
  approvedMangaId: z.string().optional(),
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

/**
 * Submit a manga (Server Action)
 * Handles the final submission after files are uploaded client-side
 */
export async function submitManga(data: z.input<typeof SubmitMangaSchema>) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "กรุณาเข้าสู่ระบบก่อนส่งผลงาน" };
  }

  // Validate input
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
    tagIds,
    authorCredits,
    status,
    approvedMangaId,
  } = parsed.data;

  try {
    // Generate slug if not provided
    let finalSlug = slug || generateSlug(title);

    // Ensure slug is unique
    const existingManga = await prisma.manga.findUnique({
      where: { slug: finalSlug },
    });

    if (existingManga && existingManga.id !== approvedMangaId) {
      finalSlug = `${finalSlug}-${Date.now()}`;
    }

    // Check daily submission rate limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const limit = await prisma.userSubmissionLimit.findUnique({
      where: { userId: session.user.id },
    });

    if (limit) {
      // Reset if window expired
      if (limit.windowStart < today) {
        await prisma.userSubmissionLimit.update({
          where: { userId: session.user.id },
          data: {
            submissionCount: 0,
            windowStart: new Date(),
          },
        });
      } else if (limit.submissionCount >= 5) {
        return {
          error:
            "Daily submission limit reached (5/5). Please try again tomorrow.",
        };
      }
    } else {
      await prisma.userSubmissionLimit.create({
        data: { userId: session.user.id },
      });
    }

    // Create submission
    const submission = await prisma.mangaSubmission.create({
      data: {
        userId: session.user.id,
        title,
        slug: finalSlug,
        description,
        coverImage,
        pages: JSON.stringify(pages),
        categoryId: categoryId || null,
        authorCredits,
        status: status,
        approvedMangaId: approvedMangaId || null,
        tags: {
          create: tagIds?.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        },
      },
    });

    // Increment submission count
    await prisma.userSubmissionLimit.update({
      where: { userId: session.user.id },
      data: {
        submissionCount: { increment: 1 },
        lastSubmitAt: new Date(),
      },
    });

    // Revalidate submissions page
    revalidatePath("/dashboard/submissions");

    return { success: true, submissionId: submission.id };
  } catch (error) {
    console.error("Submit manga error:", error);
    return { error: "Failed to submit manga" };
  }
}

/**
 * Create a new category (Server Action)
 * Returns existing category if name matches
 */
export async function createCategory(name: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const parsed = CreateCategorySchema.safeParse({ name });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid category name",
    };
  }

  try {
    // Check if exists (case-insensitive via lowercase comparison)
    const allCategories = await prisma.category.findMany();
    const existing = allCategories.find(
      (c) => c.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (existing) {
      return { category: existing };
    }

    // Create new category
    const category = await prisma.category.create({
      data: { name: name.trim() },
    });

    // Revalidate pages that show categories
    revalidatePath("/submit");
    revalidatePath("/");

    return { category };
  } catch (error) {
    console.error("Create category error:", error);
    return { error: "Failed to create category" };
  }
}

/**
 * Create a new tag (Server Action)
 * Returns existing tag if name matches
 */
export async function createTag(name: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (!name || name.trim().length === 0) {
    return { error: "Tag name is required" };
  }

  try {
    // Check if exists (case-insensitive via lowercase comparison)
    const allTags = await prisma.tag.findMany();
    const existing = allTags.find(
      (t) => t.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (existing) {
      return { tag: existing };
    }

    // Create new tag
    const tag = await prisma.tag.create({
      data: { name: name.trim() },
    });

    // Revalidate pages that show tags
    revalidatePath("/submit");
    revalidatePath("/");

    return { tag };
  } catch (error) {
    console.error("Create tag error:", error);
    return { error: "Failed to create tag" };
  }
}
