import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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

import sharp from "sharp";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const files = form.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const ALLOWED_MIME_TYPES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif"
    ];

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} is not allowed. Only images are permitted.` },
          { status: 400 }
        );
      }
    }

    const saved = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        let imageData: Uint8Array = new Uint8Array(arrayBuffer);
        let contentType = file.type;
        let fileName = file.name;

        // Compress image if it's an image type
        if (file.type.startsWith("image/")) {
          try {
            const compressedBuffer = await sharp(Buffer.from(imageData))
              .resize(1920, 1920, { fit: "inside", withoutEnlargement: true }) // Resize to max 1920px
              .webp({ quality: 80 }) // Convert to WebP with 80% quality
              .toBuffer();
            
            imageData = new Uint8Array(compressedBuffer);
            contentType = "image/webp";
            fileName = fileName.replace(/\.[^/.]+$/, "") + ".webp";
          } catch (error) {
            console.error("Compression failed for", fileName, error);
          }
        }

        const safeName = `${Date.now()}-${fileName.replace(
          /[^a-zA-Z0-9.-]/g,
          "_"
        )}`;

        await S3.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: safeName,
            Body: imageData,
            ContentType: contentType,
          })
        );

        // Use provided public URL or construct one
        return R2_PUBLIC_URL
          ? `${R2_PUBLIC_URL}/${safeName}`
          : `/uploads/${safeName}`;
      })
    );

    return NextResponse.json({ urls: saved });
  } catch (err) {

    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
