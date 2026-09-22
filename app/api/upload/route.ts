import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { storeAssets } from "@/lib/storage";
import { isUserBanned, isAdminRole } from "@/lib/session-utils";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isUserBanned(session)) {
    return NextResponse.json({ error: "บัญชีของคุณถูกระงับการใช้งาน" }, { status: 403 });
  }

  // A chapter can contain roughly 140 pages; leave room for multiple chapters, covers, and retries.
  // Admins get a higher limit for batch publishing.
  // This is a write-side abuse guard only and does not affect image readers.
  const userId =
    (session.user as { id?: string })?.id || session.user?.email || "unknown";
  const isAdmin = isAdminRole(session);
  const maxUploads = isAdmin ? 1000 : 500;
  const limitCheck = await checkRateLimit(
    `upload:${userId}`,
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
    const form = await request.formData();
    const files = form.getAll("files") as File[];
    const mangaId = (form.get("mangaId") as string) || "uncategorized";

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

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

