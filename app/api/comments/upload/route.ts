import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { checkRateLimit } from "@/lib/rate-limit";
import { r2Client, R2_BUCKET, getR2PublicUrl } from "@/lib/r2";
import { readValidatedImageFile } from "@/lib/image-security";
import { isUserBanned } from "@/lib/session-utils";
import sharp from "sharp";

// POST /api/comments/upload - Upload image for comment
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนอัพโหลดรูป" }, { status: 401 });
  }

  if (isUserBanned(session)) {
    return NextResponse.json({ error: "บัญชีของคุณถูกระงับการใช้งาน" }, { status: 403 });
  }

  // Rate limiting: 10 images per 15 minutes per user
  const rateLimit = await checkRateLimit(
    `comment-upload:${session.user.id}`,
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

    // Validate file size (3MB max for comments)
    const MAX_FILE_SIZE = 3 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "ไฟล์ต้องมีขนาดไม่เกิน 3MB" }, { status: 400 });
    }

    // Validate file type
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "รองรับเฉพาะไฟล์ JPEG, PNG, WebP, GIF" }, { status: 400 });
    }

    const { buffer } = await readValidatedImageFile(file, {
      maxBytes: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_TYPES,
    });

    // Compress and convert to WebP
    let imageData = new Uint8Array(buffer);
    let contentType = "image/webp";
    let fileName = file.name;

    try {
      const sharpInstance = sharp(buffer);
      const metadata = await sharpInstance.metadata();

      // Resize if too large (max 1280px width for comments)
      if (metadata.width && metadata.width > 1280) {
        sharpInstance.resize(1280, null, { fit: "inside", withoutEnlargement: true });
      }

      const compressedBuffer = await sharpInstance
        .webp({ quality: 75 })
        .toBuffer();

      imageData = new Uint8Array(compressedBuffer);
      fileName = fileName.replace(/\.[^/.]+$/, "") + ".webp";
    } catch (error) {
      console.error("Image compression failed:", error);
      return NextResponse.json({ error: "ไฟล์รูปภาพเสียหายหรือไม่รองรับ" }, { status: 400 });
    }

    // Construct path: uploads/comments/{year}/{month}/{userId}/{filename}
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const key = `uploads/comments/${year}/${month}/${session.user.id}/${safeName}`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: imageData,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    const url = getR2PublicUrl(key);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "อัพโหลดรูปไม่สำเร็จ" }, { status: 500 });
  }
}
