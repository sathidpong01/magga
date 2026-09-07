import { NextResponse } from "next/server";
import {
  DEFAULT_MANGA_PAGE_SIZE,
  getMangasWithPagination,
} from "@/lib/manga-list";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = Number.parseInt(searchParams.get("page") || "1", 10);
    const page = Number.isFinite(pageParam) ? Math.max(pageParam, 1) : 1;
    const pageSizeParam = Number.parseInt(
      searchParams.get("pageSize") || String(DEFAULT_MANGA_PAGE_SIZE),
      10
    );
    const pageSize = Number.isFinite(pageSizeParam)
      ? Math.min(Math.max(pageSizeParam, 1), 24)
      : DEFAULT_MANGA_PAGE_SIZE;
    const search = searchParams.get("search") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const tagsParam = searchParams.get("tags");
    const tagNames = tagsParam ? tagsParam.split(",").filter(Boolean) : undefined;
    const sort = searchParams.get("sort") || undefined;
    const excludeTagIdsParam = searchParams.get("excludeTagIds");
    const excludeTagIds = excludeTagIdsParam
      ? excludeTagIdsParam.split(",").filter(Boolean)
      : undefined;

    const result = await getMangasWithPagination(
      page,
      pageSize,
      search,
      categoryId,
      tagNames,
      sort,
      excludeTagIds
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
