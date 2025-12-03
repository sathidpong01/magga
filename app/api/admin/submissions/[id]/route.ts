import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET: Fetch submission details
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const submission = await prisma.mangaSubmission.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, username: true, image: true, createdAt: true } },
        category: true,
        tags: { include: { tag: true } },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json(submission);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 });
  }
}

// PUT: Update submission details (Edit before approve)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, slug, description, categoryId, tagIds, authorCredits, status } = body;

    const updateData: any = {
      title,
      slug,
      description,
      categoryId,
      authorCredits,
    };

    if (status) updateData.status = status;

    // Handle Tags Update if provided
    if (tagIds) {
      // Delete existing tags
      await prisma.mangaSubmissionTag.deleteMany({
        where: { submissionId: params.id }
      });
      // Create new tags
      updateData.tags = {
        create: tagIds.map((tagId: string) => ({
          tag: { connect: { id: tagId } }
        }))
      };
    }

    const updatedSubmission = await prisma.mangaSubmission.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error("Update submission error:", error);
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
  }
}
