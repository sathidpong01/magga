import { NextResponse } from "next/server";
import { db } from "@/db";
import { mangaSubmissions as submissionsTable, profiles as profilesTable } from "@/db/schema";
import { eq, desc, and, ilike, or, count, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

function parsePageParam(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(1, parsed));
}

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parsePageParam(searchParams.get("page"), 1, Number.MAX_SAFE_INTEGER);
    const limit = parsePageParam(searchParams.get("limit"), 10, 100);
    const search = searchParams.get("search")?.trim() || "";

    const offset = (page - 1) * limit;

    const conditions = [];
    if (status && status !== "ALL") {
      conditions.push(eq(submissionsTable.status, status));
    }

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(submissionsTable.title, searchPattern),
          sql`exists (
            select 1 from ${profilesTable}
            where ${profilesTable.id} = ${submissionsTable.userId}
            and ${profilesTable.username} ilike ${searchPattern}
          )`
        )
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const submissions = await db.query.mangaSubmissions.findMany({
      where,
      with: {
        profile: {
          columns: { name: true, email: true, username: true },
        },
      },
      orderBy: [desc(submissionsTable.submittedAt)],
      offset,
      limit,
    });

    // Count total
    const [{ total }] = await db
      .select({ total: count() })
      .from(submissionsTable)
      .where(where);

    const totalNum = Number(total);

    return NextResponse.json({
      submissions: submissions.map((s) => ({
        ...s,
        user: s.profile,
      })),
      pagination: {
        total: totalNum,
        pages: Math.ceil(totalNum / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Admin submissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
