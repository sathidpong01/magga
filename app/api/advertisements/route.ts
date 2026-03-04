import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { advertisements as adsTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-helpers";
import { unstable_cache } from "next/cache";

// Cache active ads for 5 minutes to reduce DB queries
const getActiveAds = unstable_cache(
  async () => {
    return db.query.advertisements.findMany({
      where: eq(adsTable.isActive, true),
      orderBy: [desc(adsTable.createdAt)],
    });
  },
  ["active-advertisements"],
  { revalidate: 300, tags: ["advertisements"] }
);

// GET - ดึงโฆษณาตาม placement (ใช้ all=true สำหรับ admin page เพื่อดึงทั้งหมด)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get("placement");
    const all = searchParams.get("all") === "true"; // For admin page to show all ads

    // all=true requires admin auth to prevent leaking inactive ads
    if (all) {
      const session = await auth.api.getSession({ headers: request.headers });
      const authError = requireAdmin(session);
      if (authError) return authError;

      const ads = await db.query.advertisements.findMany({
        orderBy: [desc(adsTable.createdAt)],
      });
      return NextResponse.json(ads);
    }

    // Public: use cached active ads, filter by placement client-side or here
    let ads = await getActiveAds();

    if (placement) {
      ads = ads.filter((ad: any) => ad.placement === placement);
    }

    return NextResponse.json(ads, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error fetching ads:", error);
    return NextResponse.json(
      { error: "Failed to fetch advertisements" },
      { status: 500 }
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
    const { type, title, imageUrl, linkUrl, content, placement } = body;

    if (!type || !title || !imageUrl || !placement) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [ad] = await db.insert(adsTable).values({
      type,
      title,
      imageUrl,
      linkUrl,
      content,
      placement,
    }).returning();

    return NextResponse.json(ad, { status: 201 });
  } catch (error) {
    console.error("Error creating ad:", error);
    return NextResponse.json(
      { error: "Failed to create advertisement" },
      { status: 500 }
    );
  }
}
