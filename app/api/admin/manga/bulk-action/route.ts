import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { requireAdmin } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const authError = requireAdmin(session);
    if (authError) return authError;

    const body = await req.json();
    const { ids, action } = body as {
      ids: string[];
      action: "delete" | "show" | "hide";
    };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No manga IDs provided" },
        { status: 400 }
      );
    }

    if (!["delete", "show", "hide"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    let result;

    switch (action) {
      case "delete":
        // Delete manga and related data
        result = await prisma.manga.deleteMany({
          where: { id: { in: ids } },
        });
        break;
      case "show":
        // Set isHidden to false
        result = await prisma.manga.updateMany({
          where: { id: { in: ids } },
          data: { isHidden: false },
        });
        break;
      case "hide":
        // Set isHidden to true
        result = await prisma.manga.updateMany({
          where: { id: { in: ids } },
          data: { isHidden: true },
        });
        break;
    }

    return NextResponse.json({
      success: true,
      action,
      count: result.count,
    });
  } catch (error) {
    console.error("Bulk action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
