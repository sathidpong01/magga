import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles as usersTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session || (session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { banReason } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const [user] = await db.update(usersTable)
      .set({
        banned: true,
        isBanned: true,
        banReason: banReason,
        bannedAt: new Date(),
      })
      .where(eq(usersTable.id, id))
      .returning();

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error banning user:", error);
    return NextResponse.json({ error: "Failed to ban user" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session || (session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const [user] = await db.update(usersTable)
      .set({
        banned: false,
        isBanned: false,
        banReason: null,
        bannedAt: null,
      })
      .where(eq(usersTable.id, id))
      .returning();

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error unbanning user:", error);
    return NextResponse.json(
      { error: "Failed to unban user" },
      { status: 500 }
    );
  }
}
