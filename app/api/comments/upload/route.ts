import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { storeAsset } from "@/lib/storage";
import { authenticateRequest } from "@/lib/auth-helpers";

// POST /api/comments/upload - Upload image for comment
export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  const { caller } = auth;

  // Rate limiting: 10 images per 15 minutes per user
  const rateLimit = await checkRateLimit(
    `comment-upload:${caller.user.id}`,
    10, // max 10 images
    15 * 60 * 1000 // per 15 minutes
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `คุณอัปโหลดรูปเร็วเกินไป กรุณารอ ${Math.ceil((rateLimit.resetTime! - Date.now()) / 60000)} นาที` },
      { status: 429 }
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const stored = await storeAsset(file, {
      kind: "comment-image",
      userId: caller.user.id,
    });

    return NextResponse.json({ url: stored.url });
  } catch (error: any) {
    console.error("Upload error:", error);
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

