import { NextResponse } from "next/server";
import { UUID_PATTERN } from "@/lib/manga-query";
import { getRelatedManga } from "@/lib/manga-list";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const headers = { "Cache-Control": "no-store" };
  if (!UUID_PATTERN.test(id))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400, headers });
  try {
    const mangas = await getRelatedManga(id);
    return mangas
      ? NextResponse.json({ mangas }, { headers })
      : NextResponse.json({ error: "Not found" }, { status: 404, headers });
  } catch {
    return NextResponse.json(
      { error: "Unable to load related works" },
      { status: 503, headers },
    );
  }
}
