import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const submissions = await prisma.mangaSubmission.findMany({
      where: { userId: session.user.id },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        status: true,
        submittedAt: true,
        rejectionReason: true,
        approvedMangaId: true,
      }
    });

    return NextResponse.json(submissions);

  } catch (error) {
    console.error("Fetch submissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
