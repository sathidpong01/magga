import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

// GET /api/admin/comments - Fetch all comments for admin
export async function GET(request: Request) {
  const session = await auth();
  const authError = requireAdmin(session);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "20"))
  ); // max 100
  const search = searchParams.get("search") || "";

  // Whitelist allowed sortBy fields to prevent injection
  const allowedSortFields = ["createdAt", "voteScore"];
  const sortBy = allowedSortFields.includes(searchParams.get("sortBy") || "")
    ? searchParams.get("sortBy")!
    : "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  try {
    const where = search
      ? {
          OR: [
            { content: { contains: search } },
            { user: { name: { contains: search } } },
            { user: { username: { contains: search } } },
            { manga: { title: { contains: search } } },
          ],
        }
      : {};

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          manga: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          parent: {
            select: {
              id: true,
              content: true,
              user: {
                select: {
                  name: true,
                  username: true,
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ]);

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/comments - Bulk delete comments
export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if admin
  const userRole = (session.user as { role?: string }).role;
  if (userRole?.toUpperCase() !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { commentIds } = body;

    if (!Array.isArray(commentIds) || commentIds.length === 0) {
      return NextResponse.json(
        { error: "commentIds array is required" },
        { status: 400 }
      );
    }

    // Delete votes first (foreign key constraint)
    await prisma.commentVote.deleteMany({
      where: { commentId: { in: commentIds } },
    });

    // Delete replies
    await prisma.comment.deleteMany({
      where: { parentId: { in: commentIds } },
    });

    // Delete comments
    const { count } = await prisma.comment.deleteMany({
      where: { id: { in: commentIds } },
    });

    return NextResponse.json({ deleted: count });
  } catch (error) {
    console.error("Error deleting comments:", error);
    return NextResponse.json(
      { error: "Failed to delete comments" },
      { status: 500 }
    );
  }
}
