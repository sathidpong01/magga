import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { storeAssets } from "@/lib/storage";
import { authenticateRequest } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  const { caller } = auth;

  // A chapter can contain roughly 140 pages; leave room for multiple chapters, covers, and retries.
  // Admins get a higher limit for batch publishing.
  // This is a write-side abuse guard only and does not affect image readers.
  const isAdmin = caller.user.role === "admin";
  const maxUploads = isAdmin ? 1000 : 500;
  const limitCheck = await checkRateLimit(
    `upload:${caller.user.id}`,
    maxUploads,
    60 * 60 * 1000 // per 1 hour
  );

  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: "Upload limit reached. Please try again later." },
      { status: 429 }
    );
  }

  try {
    if (Number(request.headers.get("content-length")) > 64 * 1024 * 1024) {
      return NextResponse.json({ error: "Upload batch is too large" }, { status: 413 });
    }
    const form = await request.formData();
    const entries = form.getAll("files");
    if (entries.some(file => !(file instanceof File))) return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    const files = entries as File[];
    const mangaId = (form.get("mangaId") as string) || "uncategorized";

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }
    if (files.length > 150 || files.reduce((bytes, file) => bytes + file.size, 0) > 64 * 1024 * 1024) {
      return NextResponse.json({ error: "Upload batch exceeds 150 files or 64 MB" }, { status: 413 });
    }
    const assetsLimit = await checkRateLimit(`upload-assets:${caller.user.id}`, maxUploads, 60 * 60 * 1000, { cost: files.length, failClosed: true });
    if (!assetsLimit.allowed) return NextResponse.json({ error: "Upload asset limit reached" }, { status: 429 });

    const saved = await storeAssets(files, { kind: "manga-page", mangaId });

    return NextResponse.json({
      urls: saved.map((asset) => ({
        url: asset.url,
        width: asset.width ?? 0,
        height: asset.height ?? 0,
      })),
    });
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

