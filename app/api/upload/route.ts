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
  const userId =
    (session.user as { id?: string })?.id || session.user?.email || "unknown";
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
      "image/avif",
      "image/bmp", // BMP support
      "image/heic", // iPhone HEIC (converted by Sharp)
      "image/heif", // HEIF variant
    ];

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

        // 3. Magic Number Check - Validate file signature
        const hex = buffer.toString("hex", 0, 12); // Read 12 bytes for HEIC/ftyp check
        const hex4 = hex.substring(0, 8); // First 4 bytes
        let isValidMagic = false;

        // JPEG: ffd8ff (all variants: JFIF, EXIF, DQT, SOF0, etc.)
        if (hex4.startsWith("ffd8ff")) {
          isValidMagic = true;
        }
        // PNG: 89504e47
        else if (hex4 === "89504e47") {
          isValidMagic = true;
        }
        // GIF: 47494638 (GIF8)
        else if (hex4.startsWith("47494638")) {
          isValidMagic = true;
        }
        // WebP: RIFF....WEBP (52494646)
        else if (hex4.startsWith("52494646")) {
          isValidMagic = true;
        }
        // BMP: 424d (BM)
        else if (hex4.startsWith("424d")) {
          isValidMagic = true;
        }
        // HEIC/HEIF: ftyp marker (00 00 00 xx 66 74 79 70 = ....ftyp)
        // The 4th byte offset contains 'ftyp' (66747970)
        else if (hex.includes("66747970")) {
          isValidMagic = true;
        }
        // AVIF: Also uses ftyp but with 'avif' brand
        else if (file.type === "image/avif") {
          isValidMagic = true; // AVIF has complex signature, trust MIME type
        }

        if (!isValidMagic) {
          console.warn(
            `Invalid file signature for ${file.name}: header ${hex4}`
          );
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
              sharpInstance.resize(maxWidth, null, {
                fit: "inside",
                withoutEnlargement: true,
              });
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
        const safeName = `${Date.now()}-${fileName.replace(
          /[^a-zA-Z0-9.-]/g,
          "_"
        )}`;
        const key = `uploads/${year}/${month}/${mangaId}/${safeName}`;

        await S3.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: imageData,
            ContentType: contentType,
            CacheControl: "public, max-age=31536000, immutable",
          })
        );

        return R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : `/${key}`;
      })
    );

    return NextResponse.json({ urls: saved });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}
