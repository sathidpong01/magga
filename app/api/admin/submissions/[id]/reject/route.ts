import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { rejectionReason, reviewNote } = body;

    if (!rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    await prisma.mangaSubmission.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
        reviewNote,
        rejectionReason,
      },
    });

    // TODO: Schedule file cleanup (Phase 4)

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reject submission error:", error);
    return NextResponse.json(
      { error: "Failed to reject submission" },
      { status: 500 }
    );
  }
}
