import { adminPageQuery, escapeLike, pageSlice } from "@/lib/admin-pagination";
import { and, asc, eq, ilike } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { advertisements as adsTable } from "@/db/schema";
import { desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidateTag } from "next/cache";
import { advertisementInput } from "@/lib/advertisement-input";
import { getPublicAds } from "@/lib/advertisements-server";

// GET - ดึงโฆษณาตาม placement (ใช้ all=true สำหรับ admin page เพื่อดึงทั้งหมด)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get("placement");
    const all = searchParams.get("all") === "true"; // For admin page to show all ads

    // all=true requires admin auth to prevent leaking inactive ads
    if (all) {
      const session = await auth.api.getSession({
        headers: request.headers,
        query: { disableCookieCache: true },
      });
      const authError = requireAdmin(session);
      if (authError) return authError;

      if (searchParams.get("paged") === "true") {
        const query = adminPageQuery(Object.fromEntries(searchParams));
        const placement = searchParams.get("placement"),
          device = searchParams.get("device");
        const rows = await db.query.advertisements.findMany({
          where: and(
            query.search
              ? ilike(adsTable.title, `%${escapeLike(query.search)}%`)
              : undefined,
            query.status === "active"
              ? eq(adsTable.isActive, true)
              : query.status === "draft"
                ? eq(adsTable.isActive, false)
                : undefined,
            placement && placement !== "all"
              ? eq(adsTable.placement, placement)
              : undefined,
            device && device !== "all"
              ? eq(adsTable.targetDevice, device)
              : undefined,
          ),
          orderBy: [desc(adsTable.createdAt), asc(adsTable.id)],
          limit: query.limit + 1,
          offset: (query.page - 1) * query.limit,
        });
        return NextResponse.json(pageSlice(rows, query), {
          headers: { "Cache-Control": "private, no-store" },
        });
      }
      const ads = await db.query.advertisements.findMany({
        orderBy: [desc(adsTable.createdAt)],
      });
      return NextResponse.json(ads, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    // Public: use cached active ads, filter by placement client-side or here
    let ads = await getPublicAds();

    if (placement) {
      ads = ads.filter((ad) => ad.placement === placement);
    }

    return NextResponse.json(ads, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error fetching ads:", error);
    return NextResponse.json(
      { error: "Failed to fetch advertisements" },
      { status: 500 },
    );
  }
}

// POST - สร้างโฆษณาใหม่ (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const authError = requireAdmin(session);
    if (authError) return authError;

    const body = await request.json();
    const parsed = advertisementInput.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลโฆษณาไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const [ad] = await db.insert(adsTable).values(parsed.data).returning();

    revalidateTag("advertisements", { expire: 0 });

    return NextResponse.json(ad, { status: 201 });
  } catch (error) {
    console.error("Error creating ad:", error);
    return NextResponse.json(
      { error: "Failed to create advertisement" },
      { status: 500 },
    );
  }
}
