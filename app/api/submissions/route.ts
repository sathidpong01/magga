import { NextResponse } from "next/server";
import { db } from "@/db";
import { mangaSubmissions as submissionsTable, mangaSubmissionTags as submissionTagsTable, userSubmissionLimits as submissionLimitsTable, manga as mangaTable } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { z } from "zod";

const submissionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().url("Invalid cover image URL"),
  pages: z.array(z.string().url("Invalid page URL")).min(1, "At least one page is required"),
  categoryId: z.string().nullable().optional(),
  authorId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
  extraMetadata: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING"]).optional().default("PENDING"),
  approvedMangaId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = submissionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { 
      title, slug, description, coverImage, pages, categoryId, authorId, tagIds, 
      extraMetadata, status, approvedMangaId 
    } = validation.data;

    // Generate slug if not provided
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = title
        .toLowerCase()
        .trim()
        .replace(/[\s]+/g, "-")
        .replace(/[^\w\-\u0E00-\u0E7F]+/g, "")
        .replace(/\-\-+/g, "-");
    }

    // Ensure slug is unique
    const [existingManga] = await db
      .select({ id: mangaTable.id })
      .from(mangaTable)
      .where(eq(mangaTable.slug, finalSlug))
      .limit(1);

    if (existingManga && existingManga.id !== approvedMangaId) {
      finalSlug = `${finalSlug}-${Date.now()}`;
    }

    // Check Rate Limit
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
        return NextResponse.json(
          { error: "Daily submission limit reached (5/5). Please try again tomorrow." },
          { status: 429 }
        );
      }
    } else {
      await db.insert(submissionLimitsTable).values({ userId: session.user.id });
    }

    // Create Submission
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
        extraMetadata,
        status,
        approvedMangaId: approvedMangaId || null,
      })
      .returning();

    // Add tags if any
    if (tagIds && tagIds.length > 0) {
      await db.insert(submissionTagsTable).values(
        tagIds.map((tagId) => ({
          submissionId: submission.id,
          tagId,
        }))
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

    return NextResponse.json({ success: true, submissionId: submission.id });

  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit manga" },
      { status: 500 }
    );
  }
}
