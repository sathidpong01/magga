import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { mangaSubmissions as submissionsTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const submissions = await db.query.mangaSubmissions.findMany({
      where: eq(submissionsTable.userId, session.user.id),
      orderBy: [desc(submissionsTable.submittedAt)],
      columns: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        status: true,
        submittedAt: true,
        rejectionReason: true,
        approvedMangaId: true,
      }
    });

    return NextResponse.json(submissions);

  } catch (error) {
    console.error("Fetch submissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
