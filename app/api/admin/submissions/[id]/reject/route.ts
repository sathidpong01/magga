import { NextResponse } from "next/server";
import { db } from "@/db";
import { mangaSubmissions as submissionsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session || (session?.user as any)?.role !== "admin") {
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

    await db
      .update(submissionsTable)
      .set({
        status: "REJECTED",
        reviewedAt: new Date().toISOString(),
        reviewedBy: session.user.id,
        reviewNote,
        rejectionReason,
      })
      .where(eq(submissionsTable.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reject submission error:", error);
    return NextResponse.json(
      { error: "Failed to reject submission" },
      { status: 500 }
    );
  }
}
