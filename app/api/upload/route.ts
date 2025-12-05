import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { checkRateLimit } from "@/lib/rate-limit";

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

  // Rate limiting: 50 uploads per hour per user
  const userId = (session.user as { id?: string })?.id || session.user?.email || "unknown";
  const limitCheck = await checkRateLimit(
    `upload:${userId}`,
    50, // max 50 uploads
    60 * 60 * 1000 // per 1 hour
  );

  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: "Upload limit reached. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const form = await request.formData();
    const files = form.getAll("files") as File[];
    const mangaId = (form.get("mangaId") as string) || "uncategorized";
    const maxWidth = parseInt((form.get("maxWidth") as string) || "1920");

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_MIME_TYPES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif"
    ];

    // Magic Numbers
    const MAGIC_NUMBERS: Record<string, string> = {
      "ffd8ffe0": "image/jpeg",
      "ffd8ffe1": "image/jpeg",
      "ffd8ffe2": "image/jpeg",
      "89504e47": "image/png",
      "47494638": "image/gif",
      "52494646": "image/webp", // RIFF...WEBP
    };

    const saved = await Promise.all(
      files.map(async (file) => {
        // 1. File Size Check
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File ${file.name} is too large (max 10MB)`);
        }

        // 2. MIME Type Check
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          throw new Error(`File type ${file.type} is not allowed.`);
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 3. Magic Number Check
        const hex = buffer.toString("hex", 0, 4);
        let isValidMagic = false;
        // Simple check for common types. For WebP it's a bit more complex (RIFF...WEBP), 
        // but '52494646' (RIFF) is a good start.
        for (const magic in MAGIC_NUMBERS) {
          if (hex.startsWith(magic)) {
            isValidMagic = true;
            break;
          }
        }
        // Allow if magic number matches or if it's AVIF (complex signature)
        if (!isValidMagic && file.type !== "image/avif") {
             // Strict check: Reject files with invalid headers to save resources
             console.warn(`Invalid file signature for ${file.name}: header ${hex}`);
             throw new Error(`Invalid file signature for ${file.name}`);
        }

        let imageData = new Uint8Array(arrayBuffer);
        let contentType = file.type;
        let fileName = file.name;

        // 4. Resize & Compress
        if (file.type.startsWith("image/")) {
          try {
            const sharpInstance = sharp(buffer);
            const metadata = await sharpInstance.metadata();
            
            // Only resize if width is greater than maxWidth
            if (metadata.width && metadata.width > maxWidth) {
                 sharpInstance.resize(maxWidth, null, { fit: "inside", withoutEnlargement: true });
            }

            const compressedBuffer = await sharpInstance
              .webp({ quality: 80 })
              .toBuffer();
            
            imageData = new Uint8Array(compressedBuffer);
            contentType = "image/webp";
            fileName = fileName.replace(/\.[^/.]+$/, "") + ".webp";
          } catch (error) {
            console.error("Compression failed for", fileName, error);
            throw error;
          }
        }

        // 5. Construct Path: uploads/{year}/{month}/{mangaId}/{filename}
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const key = `uploads/${year}/${month}/${mangaId}/${safeName}`;

        await S3.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: imageData,
            ContentType: contentType,
          })
        );

        return R2_PUBLIC_URL
          ? `${R2_PUBLIC_URL}/${key}`
          : `/${key}`;
      })
    );

    return NextResponse.json({ urls: saved });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
