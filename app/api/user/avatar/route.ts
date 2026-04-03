import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { profiles as usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET, getR2PublicUrl } from "@/lib/r2";
import sharp from "sharp";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "ไฟล์ต้องมีขนาดไม่เกิน 5MB" }, { status: 400 });
    }

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "รองรับเฉพาะไฟล์ JPEG, PNG, WebP, GIF" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Resize to 200x200 square, convert to webp
    const processedBuffer = await sharp(buffer)
      .resize(200, 200, { fit: "cover", position: "centre" })
      .webp({ quality: 85 })
      .toBuffer();

    const safeName = `${Date.now()}-avatar.webp`;
    const key = `uploads/avatars/${session.user.id}/${safeName}`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: new Uint8Array(processedBuffer),
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    const imageUrl = getR2PublicUrl(key);

    // Update profile image in DB
    await db
      .update(usersTable)
      .set({ image: imageUrl, updatedAt: new Date() })
      .where(eq(usersTable.id, session.user.id));

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: "อัพโหลดรูปไม่สำเร็จ" }, { status: 500 });
  }
}
