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
    const { rejectionReason, reviewNote } = body;

    if (!rejectionReason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    await prisma.mangaSubmission.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
        reviewNote,
        rejectionReason
      }
    });

    // TODO: Schedule file cleanup (Phase 4)

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Reject submission error:", error);
    return NextResponse.json({ error: "Failed to reject submission" }, { status: 500 });
  }
}
