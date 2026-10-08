import { CommentError, ValidationCommentError } from "./types";

/** Bound JSON before parsing, including requests sent with chunked encoding. */
export async function readCommentJson(request: Request, maxBytes = 8192): Promise<unknown> {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get("content-type") || "")) throw new ValidationCommentError("กรุณาส่งข้อมูลแบบ JSON");
  const bytes = await readBoundedBody(request, maxBytes);
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new ValidationCommentError("ข้อมูล JSON ไม่ถูกต้อง"); }
}

export async function readCommentFormData(request: Request, maxBytes: number) {
  const contentType = request.headers.get('content-type') || '';
  if (!/^multipart\/form-data;/i.test(contentType)) throw new ValidationCommentError('รูปแบบไฟล์อัปโหลดไม่ถูกต้อง');
  const bytes = await readBoundedBody(request, maxBytes);
  if (bytes.length !== Number(request.headers.get('content-length'))) throw new ValidationCommentError('ขนาดคำขออัปโหลดไม่ตรงกับข้อมูล');
  try { return await new Response(new Uint8Array(bytes), { headers: { 'content-type': contentType } }).formData(); }
  catch { throw new ValidationCommentError('ข้อมูลไฟล์อัปโหลดไม่ถูกต้อง'); }
}

async function readBoundedBody(request: Request, maxBytes: number) {
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) throw new CommentError("ข้อมูลคำขอมีขนาดใหญ่เกินไป", 413, "PAYLOAD_TOO_LARGE");
  if (!request.body) throw new ValidationCommentError("ไม่มีข้อมูลคำขอ");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new CommentError("ข้อมูลคำขอมีขนาดใหญ่เกินไป", 413, "PAYLOAD_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}
