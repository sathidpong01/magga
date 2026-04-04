import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { checkRateLimit } from "@/lib/rate-limit";
import { r2Client, R2_BUCKET, getR2PublicUrl } from "@/lib/r2";
import { readValidatedImageFile, sanitizeObjectKeySegment } from "@/lib/image-security";
import { isUserBanned } from "@/lib/session-utils";

import sharp from "sharp";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isUserBanned(session)) {
    return NextResponse.json({ error: "บัญชีของคุณถูกระงับการใช้งาน" }, { status: 403 });
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
    const mangaId = sanitizeObjectKeySegment(
      (form.get("mangaId") as string) || "uncategorized",
      "uncategorized"
    );

    // Upload type: 'cover' = 400px, 'page' = 1920px (default)
    const uploadType = (form.get("type") as string) || "page";
    const maxWidth = uploadType === "cover" ? 400 : 1920;

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
        const { buffer } = await readValidatedImageFile(file, {
          maxBytes: MAX_FILE_SIZE,
          allowedMimeTypes: ALLOWED_MIME_TYPES,
        });

        let imageData = new Uint8Array(buffer);
        let contentType = file.type;
        let fileName = file.name;
        let finalWidth = 0;
        let finalHeight = 0;

        // 4. Resize & Compress
        if (file.type.startsWith("image/")) {
          try {
            const sharpInstance = sharp(buffer);
            const metadata = await sharpInstance.metadata();

            // Store original dimensions (or resized if we resize)
            finalWidth = metadata.width || 0;
            finalHeight = metadata.height || 0;

            // Only resize if width is greater than maxWidth
            if (metadata.width && metadata.width > maxWidth) {
              sharpInstance.resize(maxWidth, null, {
                fit: "inside",
                withoutEnlargement: true,
              });
              // Calculate new dimensions after resize
              if (metadata.width && metadata.height) {
                const ratio = maxWidth / metadata.width;
                finalWidth = maxWidth;
                finalHeight = Math.round(metadata.height * ratio);
              }
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

        await r2Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: imageData,
            ContentType: contentType,
            CacheControl: "public, max-age=31536000, immutable",
          })
        );

        // Return object with url and dimensions for CLS prevention
        return {
          url: getR2PublicUrl(key),
          width: finalWidth,
          height: finalHeight,
        };
      })
    );

    return NextResponse.json({ urls: saved });
  } catch (err: any) {
    console.error("Upload error:", err);
    const status =
      typeof err?.message === "string" && /file|image|upload/i.test(err.message)
        ? 400
        : 500;
    return NextResponse.json(
      { error: err.message || "Upload failed" },
      { status }
    );
  }
}
