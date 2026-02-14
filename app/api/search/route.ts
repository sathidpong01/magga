import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Cache search index for 5 minutes
const getSearchIndex = unstable_cache(
  async () => {
    const mangas = await prisma.manga.findMany({
      where: { isHidden: false },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        coverImage: true,
        category: {
          select: { name: true },
        },
        tags: {
          select: { name: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return mangas.map((manga) => ({
      id: manga.id,
      slug: manga.slug,
      title: manga.title,
      description: (manga.description || "").slice(0, 100),
      coverImage: manga.coverImage,
      authorName: (manga as any).authorName || "", // Will work after SQL migration
      category: manga.category?.name || "",
      tags: manga.tags.map((t) => t.name).join(", "),
    }));
  },
  ["search-index"],
  { revalidate: 300, tags: ["search-index"] }
);

export async function GET() {
  try {
    const searchIndex = await getSearchIndex();
    return NextResponse.json(searchIndex, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error fetching search index:", error);
    return NextResponse.json(
      { error: "Failed to fetch search index" },
      { status: 500 }
    );
  }
}
