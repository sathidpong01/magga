import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { profiles as usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { storeAsset } from "@/lib/storage";
import { isUserBanned } from "@/lib/session-utils";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isUserBanned(session)) {
    return NextResponse.json({ error: "บัญชีของคุณถูกระงับการใช้งาน" }, { status: 403 });
  }

  const rateLimit = await checkRateLimit(`avatar:${session.user.id}`, 10, 60 * 60 * 1000);
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
      userId: session.user.id,
    });

    // Update profile image in DB
    await db
      .update(usersTable)
      .set({ image: stored.url, updatedAt: new Date() })
      .where(eq(usersTable.id, session.user.id));

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

