import { NextResponse } from "next/server";
import { db } from "@/db";
import { profiles as usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { storeAsset } from "@/lib/storage";
import { authenticateRequest } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  const { caller } = auth;

  const rateLimit = await checkRateLimit(`avatar:${caller.user.id}`, 10, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "อัปโหลดรูปโปรไฟล์บ่อยเกินไป กรุณาลองใหม่ภายหลัง" }, { status: 429 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const stored = await storeAsset(file, {
      kind: "avatar",
      userId: caller.user.id,
    });

    // Update profile image in DB
    await db
      .update(usersTable)
      .set({ image: stored.url, updatedAt: new Date() })
      .where(eq(usersTable.id, caller.user.id));

    return NextResponse.json({ imageUrl: stored.url });
  } catch (error: any) {
    console.error("Avatar upload error:", error);
    const status =
      typeof error?.message === "string" && /file|image|upload/i.test(error.message)
        ? 400
        : 500;
    return NextResponse.json(
      { error: error?.message || "อัพโหลดรูปไม่สำเร็จ" },
      { status }
    );
  }
}

