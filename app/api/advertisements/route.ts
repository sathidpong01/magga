import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET - ดึงโฆษณาตาม placement (ใช้ all=true สำหรับ admin page เพื่อดึงทั้งหมด)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get("placement");
    const all = searchParams.get("all") === "true"; // For admin page to show all ads

    const where: { isActive?: boolean; placement?: string } = {};
    
    // ถ้าไม่ใช่ all mode ให้ filter เฉพาะ active
    if (!all) {
      where.isActive = true;
    }
    
    if (placement) {
      where.placement = placement;
    }

    const ads = await prisma.advertisement.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(ads);
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
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, imageUrl, linkUrl, content, placement } = body;

    if (!type || !title || !imageUrl || !placement) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const ad = await prisma.advertisement.create({
      data: {
        type,
        title,
        imageUrl,
        linkUrl,
        content,
        placement,
      },
    });

    return NextResponse.json(ad, { status: 201 });
  } catch (error) {
    console.error("Error creating ad:", error);
    return NextResponse.json(
      { error: "Failed to create advertisement" },
      { status: 500 }
    );
  }
}
