import { readAdminSubmissions } from "@/lib/admin-submissions";
import { NextResponse } from "next/server";



import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-helpers";

function parsePageParam(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(1, parsed));
}

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
      query: { disableCookieCache: true },
    });
    const authError = requireAdmin(session);
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parsePageParam(searchParams.get("page"), 1, 10000);
    const limit = parsePageParam(searchParams.get("limit"), 10, 100);
    const search = (searchParams.get("search")?.trim() || "").slice(0, 120);

    const result = await readAdminSubmissions({
      status: status ?? "ALL",
      page,
      limit,
      search,
    });
    const submissions = result.items,
      totalNum = result.total;

    return NextResponse.json(
      {
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
      },
      {
        headers: {
          "Cache-Control": "private, no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error("Admin submissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 },
    );
  }
}
