import { NextResponse } from "next/server";
import { db } from "@/db";
import { mangaSubmissions as submissionsTable, mangaSubmissionTags as submissionTagsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const submissions = await db.query.mangaSubmissions.findMany({
      where: eq(submissionsTable.userId, session.user.id),
      columns: {
        id: true,
        title: true,
        coverImage: true,
        status: true,
        submittedAt: true,
        slug: true,
      },
      orderBy: (s, { desc }) => [desc(s.submittedAt)],
    });

    // Map submittedAt to createdAt for frontend consistency
    const formatted = submissions.map((sub) => ({
      ...sub,
      createdAt: sub.submittedAt,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching user submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
