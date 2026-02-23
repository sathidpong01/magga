import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

// GET - ดึงรายการฝากลงของ user ที่ login อยู่
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const submissions = await prisma.mangaSubmission.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        coverImage: true,
        status: true,
        submittedAt: true,
        slug: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    // Map submittedAt to createdAt for frontend consistency
    const formatted = submissions.map((sub) => ({
      ...sub,
      createdAt: sub.submittedAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching user submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
