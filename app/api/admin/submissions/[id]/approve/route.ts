import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { reviewNote, publishImmediately } = body;

    // 1. Get Submission
    const submission = await prisma.mangaSubmission.findUnique({
      where: { id: params.id },
      include: { tags: true }
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.status === 'APPROVED') {
      return NextResponse.json({ error: "Submission already approved" }, { status: 400 });
    }

    // 2. Create Manga Record
    const manga = await prisma.manga.create({
      data: {
        title: submission.title,
        slug: submission.slug || submission.title.toLowerCase().replace(/\s+/g, '-'),
        description: submission.description,
        coverImage: submission.coverImage,
        pages: submission.pages, // Already JSON string
        categoryId: submission.categoryId,
        authorCredits: submission.authorCredits,
        isHidden: !publishImmediately,
        tags: {
          connect: submission.tags.map(t => ({ id: t.tagId }))
        }
      }
    });

    // 3. Update Submission Status
    await prisma.mangaSubmission.update({
      where: { id: params.id },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
        reviewNote,
        approvedMangaId: manga.id
      }
    });

    return NextResponse.json({ success: true, mangaId: manga.id });

  } catch (error) {
    console.error("Approve submission error:", error);
    return NextResponse.json({ error: "Failed to approve submission" }, { status: 500 });
  }
}
