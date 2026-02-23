import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { requireAdmin } from "@/lib/auth-helpers";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    const authError = requireAdmin(session);
    if (authError) return authError;

    const body = await req.json();
    const { id, categoryName, tagNames, authorName } = body as {
      id: string;
      categoryName?: string;
      tagNames?: string[];
      authorName?: string;
    };

    if (!id) {
      return NextResponse.json(
        { error: "Manga ID is required" },
        { status: 400 }
      );
    }

    // Find category by name
    let categoryId = null;
    if (categoryName) {
      const category = await prisma.category.findFirst({
        where: { name: categoryName },
      });
      categoryId = category?.id || null;
    }

    // Find tags by names
    const tags =
      tagNames && tagNames.length > 0
        ? await prisma.tag.findMany({
            where: { name: { in: tagNames } },
          })
        : [];

    // Find author by name
    let authorId = null;
    if (authorName) {
      const author = await prisma.author.findFirst({
        where: { name: authorName },
      });
      authorId = author?.id || null;
    }

    // Update manga
    const updatedManga = await prisma.manga.update({
      where: { id },
      data: {
        categoryId: categoryId,
        authorId: authorId,
        tags: {
          set: tags.map((tag) => ({ id: tag.id })),
        },
      },
      include: {
        category: true,
        tags: true,
        author: true,
      },
    });

    return NextResponse.json({
      success: true,
      manga: updatedManga,
    });
  } catch (error) {
    console.error("Quick edit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
