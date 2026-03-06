import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { blockedTags, tags } from "@/db/schema";
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
        id: blockedTags.id,
        tagId: blockedTags.tagId,
        createdAt: blockedTags.createdAt,
        tag: { name: tags.name },
      })
      .from(blockedTags)
      .leftJoin(tags, eq(tags.id, blockedTags.tagId))
      .where(eq(blockedTags.userId, session.user.id));

    return NextResponse.json({ blockedTags: rows });
  } catch (error) {
    console.error("Get blocked tags error:", error);
    return NextResponse.json({ error: "Failed to fetch blocked tags" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tagId } = z.object({ tagId: z.string().uuid() }).parse(await req.json());

    const tag = await db.query.tags.findFirst({
      where: eq(tags.id, tagId),
      columns: { id: true },
    });

    if (!tag) {
      return NextResponse.json({ error: "ไม่พบแท็ก" }, { status: 404 });
    }

    await db.insert(blockedTags).values({
      userId: session.user.id,
      tagId,
    }).onConflictDoNothing();

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("Block tag error:", error);
    return NextResponse.json({ error: "Failed to block tag" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tagId = searchParams.get("tagId");

    if (!tagId) {
      return NextResponse.json({ error: "tagId required" }, { status: 400 });
    }

    await db
      .delete(blockedTags)
      .where(
        and(
          eq(blockedTags.userId, session.user.id),
          eq(blockedTags.tagId, tagId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unblock tag error:", error);
    return NextResponse.json({ error: "Failed to unblock tag" }, { status: 500 });
  }
}
