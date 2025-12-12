import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

const ITEMS_PER_PAGE = 12;

// Cache the query for 60 seconds
const getMangasWithPagination = unstable_cache(
  async (
    page: number,
    search?: string,
    categoryId?: string,
    tagNames?: string[],
    sort?: string
  ) => {
    const skip = (page - 1) * ITEMS_PER_PAGE;

    // Build Where Clause
    const where: Prisma.MangaWhereInput = {
      isHidden: false,
    };

    if (search) {
      where.title = { contains: search };
    }

    if (categoryId && categoryId !== "all") {
      where.categoryId = categoryId;
    }

    if (tagNames && tagNames.length > 0) {
      where.tags = {
        some: {
          name: { in: tagNames },
        },
      };
    }

    // Build OrderBy
    let orderBy: Prisma.MangaOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "updated") {
      orderBy = { updatedAt: "desc" };
    } else if (sort === "az") {
      orderBy = { title: "asc" };
    }

    // Fetch mangas with count
    const [mangas, total] = await Promise.all([
      prisma.manga.findMany({
        where,
        orderBy,
        skip,
        take: ITEMS_PER_PAGE,
        select: {
          id: true,
          slug: true,
          title: true,
          coverImage: true,
          viewCount: true,
          averageRating: true,
          category: {
            select: { name: true },
          },
          tags: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.manga.count({ where }),
    ]);

    return {
      mangas,
      total,
      page,
      totalPages: Math.ceil(total / ITEMS_PER_PAGE),
      hasMore: skip + mangas.length < total,
    };
  },
  ["manga-list"],
  { revalidate: 60, tags: ["manga-list"] }
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const search = searchParams.get("search") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const tagsParam = searchParams.get("tags");
    const tagNames = tagsParam ? tagsParam.split(",") : undefined;
    const sort = searchParams.get("sort") || undefined;

    const result = await getMangasWithPagination(
      page,
      search,
      categoryId,
      tagNames,
      sort
    );

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error fetching manga list:", error);
    return NextResponse.json(
      { error: "Failed to fetch manga list" },
      { status: 500 }
    );
  }
}
