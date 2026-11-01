import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { getDefaultStorageAdapter } from "@/lib/storage";
import { authenticateRequest } from "@/lib/auth-helpers";
import { MANGA_UPLOAD_MAX_BODY_BYTES, mangaImageSelectionError } from "@/lib/manga-upload-policy";
import { MangaUploadError, storeMangaUpload } from "@/lib/storage/manga-uploads";

async function readUploadForm(request: Request) {
  if (Number(request.headers.get("content-length")) > MANGA_UPLOAD_MAX_BODY_BYTES)
    throw new MangaUploadError("ส่งรูปได้ครั้งละ 1 ไฟล์ ขนาดไม่เกิน 4 MiB", 413);
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data;") || !request.body)
    throw new MangaUploadError("รูปแบบคำขอไม่ถูกต้อง", 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MANGA_UPLOAD_MAX_BODY_BYTES) {
        await reader.cancel();
        throw new MangaUploadError("ข้อมูลอัปโหลดมีขนาดใหญ่เกินกำหนด", 413);
      }
      chunks.push(new Uint8Array(value));
    }
  } finally { reader.releaseLock(); }
  try {
    return await new Response(new Blob(chunks), { headers: { "content-type": request.headers.get("content-type") || "" } }).formData();
  } catch { throw new MangaUploadError("ข้อมูลอัปโหลดไม่ถูกต้อง", 400); }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  try {
    const parsedId = z.uuid().safeParse(request.headers.get("x-upload-id"));
    if (!parsedId.success) throw new MangaUploadError("กรุณาระบุรหัสอัปโหลดที่ถูกต้อง", 400);
    const { user } = auth.caller;
    const limit = await checkRateLimit(`upload:${user.id}`, user.role === "admin" ? 1000 : 500, 60 * 60 * 1000, { failClosed: true });
    if (!limit.allowed) return NextResponse.json({ error: "อัปโหลดเกินโควตา กรุณาลองใหม่ภายหลัง" }, { status: 429, headers: { "Retry-After": "60" } });
    const form = await readUploadForm(request);
    const files = form.getAll("files");
    const file = files[0];
    if (files.length !== 1 || !(file instanceof File)) throw new MangaUploadError("ส่งรูปได้ครั้งละ 1 ไฟล์", 400);
    const error = mangaImageSelectionError(file);
    if (error) throw new MangaUploadError(error, 400);
    const asset = await storeMangaUpload(db, getDefaultStorageAdapter(), { userId: user.id, uploadId: parsedId.data, file });
    return NextResponse.json({ urls: [asset] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof MangaUploadError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Manga upload failed:", error);
    return NextResponse.json({ error: "อัปโหลดไม่สำเร็จ กรุณาลองใหม่" }, { status: 500 });
  }
}
