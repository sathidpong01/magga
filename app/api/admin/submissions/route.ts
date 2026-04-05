import { NextResponse } from "next/server";
import { db } from "@/db";
import { mangaSubmissions as submissionsTable, mangaSubmissionTags as submissionTagsTable, profiles as profilesTable } from "@/db/schema";
import { eq, desc, and, ilike, or, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const authError = requireAdmin(session);
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10") || 10));
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * limit;

    const conditions = [];
    if (status && status !== "ALL") {
      conditions.push(eq(submissionsTable.status, status));
    }

    const submissions = await db.query.mangaSubmissions.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        profile: {
          columns: { name: true, email: true, username: true },
        },
      },
      orderBy: [desc(submissionsTable.submittedAt)],
      offset,
      limit,
    });

    // Filter by search if needed (done in memory for simplicity)
    const filtered = search
      ? submissions.filter(
          (s) =>
            s.title.toLowerCase().includes(search.toLowerCase()) ||
            (s.profile as any)?.username?.toLowerCase().includes(search.toLowerCase())
        )
      : submissions;

    // Count total
    const [{ total }] = await db
      .select({ total: count() })
      .from(submissionsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalNum = Number(total);

    return NextResponse.json(
      {
        submissions: filtered.map((s) => ({
          ...s,
          user: s.profile,
        })),
        pagination: {
          total: totalNum,
          pages: Math.ceil(totalNum / limit),
          page,
          limit,
        },
      },
      {
        headers: {
          "Cache-Control": "private, no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Admin submissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
