import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { blockedUsers, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
      .select({
        id: blockedUsers.id,
        blockedUserId: blockedUsers.blockedUserId,
        createdAt: blockedUsers.createdAt,
        blockedUser: {
          name: profiles.name,
          username: profiles.username,
          image: profiles.image,
        },
      })
      .from(blockedUsers)
      .leftJoin(profiles, eq(profiles.id, blockedUsers.blockedUserId))
      .where(eq(blockedUsers.userId, session.user.id));

    return NextResponse.json({ blockedUsers: rows });
  } catch (error) {
    console.error("Get blocked users error:", error);
    return NextResponse.json({ error: "Failed to fetch blocked users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { blockedUserId } = z.object({ blockedUserId: z.string() }).parse(await req.json());

    if (blockedUserId === session.user.id) {
      return NextResponse.json({ error: "ไม่สามารถบล็อกตัวเองได้" }, { status: 400 });
    }

    const targetUser = await db.query.profiles.findFirst({
      where: eq(profiles.id, blockedUserId),
      columns: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    await db.insert(blockedUsers).values({
      userId: session.user.id,
      blockedUserId,
    }).onConflictDoNothing();

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("Block user error:", error);
    return NextResponse.json({ error: "Failed to block user" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const blockedUserId = searchParams.get("blockedUserId");

    if (!blockedUserId) {
      return NextResponse.json({ error: "blockedUserId required" }, { status: 400 });
    }

    await db
      .delete(blockedUsers)
      .where(
        and(
          eq(blockedUsers.userId, session.user.id),
          eq(blockedUsers.blockedUserId, blockedUserId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unblock user error:", error);
    return NextResponse.json({ error: "Failed to unblock user" }, { status: 500 });
  }
}
