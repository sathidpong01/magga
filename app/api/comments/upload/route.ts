import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

// POST /api/comments/upload - Upload image for comment
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนอัพโหลดรูป" }, { status: 401 });
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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compress and convert to WebP
    let imageData = new Uint8Array(buffer);
    let contentType = file.type;
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
      contentType = "image/webp";
      fileName = fileName.replace(/\.[^/.]+$/, "") + ".webp";
    } catch (error) {
      console.error("Image compression failed:", error);
      // Continue with original if compression fails
    }

    // Construct path: uploads/comments/{year}/{month}/{userId}/{filename}
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const key = `uploads/comments/${year}/${month}/${session.user.id}/${safeName}`;

    await S3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: imageData,
        ContentType: contentType,
      })
    );

    const url = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : `/${key}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "อัพโหลดรูปไม่สำเร็จ" }, { status: 500 });
  }
}
