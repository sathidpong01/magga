import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles as usersTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-helpers";
import { eq } from "drizzle-orm";

// DELETE - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const authError = requireAdmin(session);
    if (authError) return authError;

    const { id } = await params;

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete yourself" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.query.profiles.findFirst({ where: eq(usersTable.id, id) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete user (cascade will handle related records)
    await db.delete(usersTable).where(eq(usersTable.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
