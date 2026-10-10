import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles as usersTable, sessions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-helpers";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers, query: { disableCookieCache: true } });
  const authError = requireAdmin(session);
  if (authError) return authError;
  
  const { id } = await params;
  const { banReason } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const user = await db.transaction(async (tx) => {
    const [updated] = await tx.update(usersTable)
      .set({
        banned: true,
        isBanned: true,
        banReason: banReason,
        bannedAt: new Date(),
      })
      .where(eq(usersTable.id, id))
      .returning({ id: usersTable.id, name: usersTable.name, banned: usersTable.banned, isBanned: usersTable.isBanned, banReason: usersTable.banReason });

    if (updated) await tx.delete(sessions).where(eq(sessions.userId, id));
    return updated;
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
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
  const session = await auth.api.getSession({ headers: request.headers, query: { disableCookieCache: true } });
  const authError = requireAdmin(session);
  if (authError) return authError;
  
  const { id } = await params;
  
  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const user = await db.transaction(async (tx) => {
    const [updated] = await tx.update(usersTable)
      .set({
        banned: false,
        isBanned: false,
        banReason: null,
        bannedAt: null,
      })
      .where(eq(usersTable.id, id))
      .returning({ id: usersTable.id, name: usersTable.name, banned: usersTable.banned, isBanned: usersTable.isBanned, banReason: usersTable.banReason });

    if (updated) await tx.delete(sessions).where(eq(sessions.userId, id));
    return updated;
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error unbanning user:", error);
    return NextResponse.json(
      { error: "Failed to unban user" },
      { status: 500 }
    );
  }
}
