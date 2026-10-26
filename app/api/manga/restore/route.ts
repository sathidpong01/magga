import { NextResponse } from "next/server";
import { UUID_PATTERN } from "@/lib/manga-query";
import { getPublicMangaCardsByIds } from "@/lib/manga-list";
export async function GET(request: Request) {
  const ids = new URL(request.url).searchParams.getAll("id");
  const headers = { "Cache-Control": "no-store" };
  if (
    !ids.length ||
    ids.length > 60 ||
    ids.some((id) => !UUID_PATTERN.test(id)) ||
    new Set(ids).size !== ids.length
  )
    return NextResponse.json(
      { error: "Invalid manga IDs" },
      { status: 400, headers },
    );
  try {
    return NextResponse.json(
      { mangas: await getPublicMangaCardsByIds(ids) },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to restore list" },
      { status: 503, headers },
    );
  }
}
