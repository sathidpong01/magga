import { NextResponse } from "next/server";
import { db } from "@/db";
import { mangaSubmissions as submissionsTable } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers, query: { disableCookieCache: true } });
    const authError = requireAdmin(session);
    if (authError || !session) {
      return authError ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = z.object({ rejectionReason: z.string().trim().min(1).max(5000), reviewNote: z.string().max(5000).optional() }).safeParse(body);
    if (!z.string().uuid().safeParse(id).success || !parsed.success) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }
    const { rejectionReason, reviewNote } = parsed.data;
    const [updated] = await db
      .update(submissionsTable)
      .set({
        status: "REJECTED",
        reviewedAt: new Date().toISOString(),
        reviewedBy: session.user.id,
        reviewNote,
        rejectionReason,
      })
      .where(and(eq(submissionsTable.id, id), inArray(submissionsTable.status, ["PENDING", "UNDER_REVIEW", "REJECTED"])))
      .returning({ id: submissionsTable.id });
    if (!updated) return NextResponse.json({ error: "Submission not found or already approved" }, { status: 409 });

    revalidatePath("/dashboard/admin/submissions");
    revalidatePath("/dashboard/submissions");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reject submission error:", error);
    return NextResponse.json(
      { error: "Failed to reject submission" },
      { status: 500 }
    );
  }
}
