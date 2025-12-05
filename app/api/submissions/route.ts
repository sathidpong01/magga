import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const submissionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().url("Invalid cover image URL"),
  pages: z.array(z.string().url("Invalid page URL")).min(1, "At least one page is required"),
  categoryId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
  authorCredits: z.string().optional(), // JSON string
  extraMetadata: z.string().optional(), // JSON string
  status: z.enum(["DRAFT", "PENDING"]).optional().default("PENDING"),
  approvedMangaId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
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
      title, slug, description, coverImage, pages, categoryId, tagIds, 
      authorCredits, extraMetadata, status, approvedMangaId 
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

    // Ensure slug is unique (check both Manga and MangaSubmission)
    const existingManga = await prisma.manga.findUnique({ where: { slug: finalSlug } });
    if (existingManga && existingManga.id !== approvedMangaId) {
      finalSlug = `${finalSlug}-${Date.now()}`;
    }

    // Check Rate Limit (Skip for DRAFT updates? Maybe not, to prevent spam)
    // For now, apply to all creations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const limit = await prisma.userSubmissionLimit.findUnique({
      where: { userId: session.user.id }
    });

    if (limit) {
      // Check if window expired (reset daily)
      if (limit.windowStart < today) {
        await prisma.userSubmissionLimit.update({
          where: { userId: session.user.id },
          data: {
            submissionCount: 0,
            windowStart: new Date(),
          }
        });
      } else if (limit.submissionCount >= 5) {
        return NextResponse.json(
          { error: "Daily submission limit reached (5/5). Please try again tomorrow." },
          { status: 429 }
        );
      }
    } else {
      await prisma.userSubmissionLimit.create({
        data: { userId: session.user.id }
      });
    }

    // Create Submission
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
        extraMetadata,
        status: status, // DRAFT or PENDING
        approvedMangaId: approvedMangaId || null,
        tags: {
          create: tagIds?.map(tagId => ({
            tag: { connect: { id: tagId } }
          }))
        }
      }
    });

    // Increment submission count
    await prisma.userSubmissionLimit.update({
      where: { userId: session.user.id },
      data: {
        submissionCount: { increment: 1 },
        lastSubmitAt: new Date()
      }
    });

    return NextResponse.json({ success: true, submissionId: submission.id });

  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit manga" },
      { status: 500 }
    );
  }
}
