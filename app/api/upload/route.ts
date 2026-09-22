import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { checkRateLimit } from "@/lib/rate-limit";
import { r2Client, R2_BUCKET, getR2PublicUrl } from "@/lib/r2";
import { readValidatedImageFile, sanitizeObjectKeySegment } from "@/lib/image-security";
import { isUserBanned } from "@/lib/session-utils";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isUserBanned(session)) {
    return NextResponse.json({ error: "บัญชีของคุณถูกระงับการใช้งาน" }, { status: 403 });
  }

  // A chapter can contain roughly 140 pages; leave room for its cover and retries.
  // This is a write-side abuse guard only and does not affect image readers.
  const userId =
    (session.user as { id?: string })?.id || session.user?.email || "unknown";
  const limitCheck = await checkRateLimit(
    `upload:${userId}`,
    300, // max 300 uploads
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

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // Vercel Functions accept request bodies up to 4.5 MB. Reserve room for
    // multipart framing so the API can return a useful validation error.
    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB
    const ALLOWED_MIME_TYPES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
      "image/bmp",
    ];

    const saved = [];

    for (const file of files) {
      const { buffer } = await readValidatedImageFile(file, {
        maxBytes: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
      });

      // Page images are optimized before upload. Keep their bytes unchanged so
      // this request stays lightweight and readers fetch directly from R2.
      const imageData = new Uint8Array(buffer);
      const contentType = file.type;
      const fileName = file.name;

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
      saved.push({
        url: getR2PublicUrl(key),
        width: 0,
        height: 0,
      });
    }

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
