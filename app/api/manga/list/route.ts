import { NextResponse } from "next/server";
import {
  DEFAULT_MANGA_PAGE_SIZE,
  getMangasWithPagination,
} from "@/lib/manga-list";
import { MANGA_SORTS, UUID_PATTERN } from "@/lib/manga-query";

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
    const author = searchParams.get("author") || undefined;
    const tagNames = searchParams.getAll("tags");
    const sort = searchParams.get("sort") || undefined;
    if ((search && search.length > 200) || (author && author.length > 100) ||
      (categoryId && categoryId !== "all" && !UUID_PATTERN.test(categoryId)) ||
      tagNames.length > 50 || tagNames.some((tag) => tag.length > 100) ||
      (sort && !MANGA_SORTS.includes(sort as typeof MANGA_SORTS[number]))) {
      return NextResponse.json({ error: "Invalid manga filters" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    const result = await getMangasWithPagination(
      page,
      pageSize,
      search,
      categoryId,
      tagNames,
      sort,
      undefined,
      author
    );

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
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
