import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateSubmissionSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  coverImage: z.string().url("Invalid cover image URL").optional(),
  pages: z.array(z.string().url("Invalid page URL")).min(1, "At least one page is required").optional(),
  categoryId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
  authorCredits: z.string().optional(),
  extraMetadata: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING"]).optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const submission = await prisma.mangaSubmission.findUnique({
      where: { id },
      include: { tags: true }
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (submission.status !== "DRAFT" && submission.status !== "CHANGE_REQUESTED") {
      return NextResponse.json(
        { error: "Cannot edit submission in current status" },
        { status: 400 }
      );
    }

    const { 
      title, description, coverImage, pages, categoryId, tagIds, 
      authorCredits, extraMetadata, status 
    } = validation.data;

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (coverImage) updateData.coverImage = coverImage;
    if (pages) updateData.pages = JSON.stringify(pages);
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (authorCredits !== undefined) updateData.authorCredits = authorCredits;
    if (extraMetadata !== undefined) updateData.extraMetadata = extraMetadata;
    
    // If status is changing to PENDING (submitting for review)
    if (status === "PENDING") {
      updateData.status = "PENDING";
      updateData.submittedAt = new Date(); // Reset submission time? Or keep original? Usually reset for queue.
      // Clear review data
      updateData.reviewedAt = null;
      updateData.reviewedBy = null;
      updateData.rejectionReason = null;
      updateData.reviewNote = null;
    } else if (status === "DRAFT") {
      updateData.status = "DRAFT";
    }

    // Handle Tags update if provided
    if (tagIds) {
      // Delete existing tags
      await prisma.mangaSubmissionTag.deleteMany({
        where: { submissionId: id }
      });
      // Create new tags
      updateData.tags = {
        create: tagIds.map(tagId => ({
          tag: { connect: { id: tagId } }
        }))
      };
    }

    const updatedSubmission = await prisma.mangaSubmission.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, submission: updatedSubmission });

  } catch (error) {
    console.error("Update submission error:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}
