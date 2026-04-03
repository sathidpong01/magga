import { NextResponse } from "next/server";
import { db } from "@/db";
import { mangaSubmissions as submissionsTable, mangaSubmissionTags as submissionTagsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isUserBanned } from "@/lib/session-utils";
import { z } from "zod";
import { extractMangaPageUrls } from "@/lib/manga-pages";

// GET single submission
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const submission = await db.query.mangaSubmissions.findFirst({
      where: eq(submissionsTable.id, id),
      with: {
        mangaSubmissionTags: {
          with: { tag: true },
        },
        category: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = {
      ...submission,
      tags: submission.mangaSubmissionTags.map((t: any) => t.tag),
      pages: extractMangaPageUrls(JSON.parse(submission.pages)),
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error("Fetch submission error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 }
    );
  }
}

const updateSubmissionSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  coverImage: z.string().url("Invalid cover image URL").optional(),
  pages: z.array(z.string().url("Invalid page URL")).min(1, "At least one page is required").optional(),
  categoryId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
  extraMetadata: z.string().optional(),
  status: z.enum(["PENDING"]).optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isUserBanned(session)) {
      return NextResponse.json(
        { error: "บัญชีของคุณถูกระงับการใช้งาน" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const validation = updateSubmissionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const [submission] = await db
      .select()
      .from(submissionsTable)
      .where(eq(submissionsTable.id, id))
      .limit(1);

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (submission.status !== "PENDING" && submission.status !== "REJECTED") {
      return NextResponse.json(
        { error: "Cannot edit submission in current status" },
        { status: 400 }
      );
    }

    const { 
      title, description, coverImage, pages, categoryId, tagIds, 
      extraMetadata, status 
    } = validation.data;

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (coverImage) updateData.coverImage = coverImage;
    if (pages) updateData.pages = JSON.stringify(pages);
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (extraMetadata !== undefined) updateData.extraMetadata = extraMetadata;
    
    if (status === "PENDING") {
      updateData.status = "PENDING";
      updateData.submittedAt = new Date().toISOString();
      updateData.reviewedAt = null;
      updateData.reviewedBy = null;
      updateData.rejectionReason = null;
      updateData.reviewNote = null;
    }

    // Handle Tags update if provided
    if (tagIds) {
      await db
        .delete(submissionTagsTable)
        .where(eq(submissionTagsTable.submissionId, id));
      if (tagIds.length > 0) {
        await db.insert(submissionTagsTable).values(
          tagIds.map((tagId) => ({
            submissionId: id,
            tagId,
          }))
        );
      }
    }

    const [updatedSubmission] = await db
      .update(submissionsTable)
      .set(updateData)
      .where(eq(submissionsTable.id, id))
      .returning();

    return NextResponse.json({ success: true, submission: updatedSubmission });

  } catch (error) {
    console.error("Update submission error:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isUserBanned(session)) {
      return NextResponse.json(
        { error: "บัญชีของคุณถูกระงับการใช้งาน" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const [submission] = await db
      .select()
      .from(submissionsTable)
      .where(eq(submissionsTable.id, id))
      .limit(1);

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (submission.status !== "PENDING" && submission.status !== "REJECTED") {
      return NextResponse.json(
        { error: "Cannot delete submission in current status" },
        { status: 400 }
      );
    }

    // Delete tags first (cascade constraint)
    await db
      .delete(submissionTagsTable)
      .where(eq(submissionTagsTable.submissionId, id));

    await db
      .delete(submissionsTable)
      .where(eq(submissionsTable.id, id));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete submission error:", error);
    return NextResponse.json(
      { error: "Failed to delete submission" },
      { status: 500 }
    );
  }
}
