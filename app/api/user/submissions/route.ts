import { adminPageQuery, pageSlice } from "@/lib/admin-pagination";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { mangaSubmissions as submissionsTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const paged = params.get("paged") === "true";
  const query = adminPageQuery(Object.fromEntries(params));
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const submissions = await db.query.mangaSubmissions.findMany({
      where: eq(submissionsTable.userId, session.user.id),
      orderBy: [desc(submissionsTable.submittedAt), desc(submissionsTable.id)],
      ...(paged
        ? { limit: query.limit + 1, offset: (query.page - 1) * query.limit }
        : {}),
      columns: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        status: true,
        submittedAt: true,
        rejectionReason: true,
        approvedMangaId: true,
      },
    });

    return NextResponse.json(
      paged ? pageSlice(submissions, query) : submissions,
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Fetch submissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 },
    );
  }
}
