import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { advertisements as adsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// PATCH - อัพเดทโฆษณา (Admin only)
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const authError = requireAdmin(session);
    if (authError) return authError;
    
    const { id } = await context.params;
    const body = await request.json();

    const updateData = { ...body, updatedAt: new Date().toISOString() };
    const [ad] = await db.update(adsTable)
      .set(updateData)
      .where(eq(adsTable.id, id))
      .returning();

    return NextResponse.json(ad);
  } catch (error) {
    console.error("Error updating ad:", error);
    return NextResponse.json(
      { error: "Failed to update advertisement" },
      { status: 500 }
    );
  }
}

// DELETE - ลบโฆษณา (Admin only)
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const authError = requireAdmin(session);
    if (authError) return authError;
    
    const { id } = await context.params;
    
    await db.delete(adsTable).where(eq(adsTable.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ad:", error);
    return NextResponse.json(
      { error: "Failed to delete advertisement" },
      { status: 500 }
    );
  }
}
