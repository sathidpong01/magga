import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, categoryId, tagIds } = body as { 
      id: string; 
      categoryId: string | null; 
      tagIds: string[] 
    };

    if (!id) {
      return NextResponse.json(
        { error: "Manga ID is required" },
        { status: 400 }
      );
    }

    // Update manga with new category and tags
    const updatedManga = await prisma.manga.update({
      where: { id },
      data: {
        categoryId: categoryId || null,
        tags: {
          set: tagIds.map((tagId) => ({ id: tagId })),
        },
      },
      include: {
        category: true,
        tags: true,
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
