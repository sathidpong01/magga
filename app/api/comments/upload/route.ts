import { NextResponse } from "next/server";
import { assertSameOrigin, requireCommentActor, ensureGuestVerification } from "@/lib/comments/identity";
import { consumeCommentLimit } from "@/lib/comments/abuse";
import { createCommentAsset } from "@/lib/comments/assets";
import { COMMENT_IMAGE_MAX_BYTES } from "@/lib/comments/image-processing";
import { ValidationCommentError } from "@/lib/comments/types";
import { handleCommentError } from "@/lib/comments";
import { readCommentFormData } from "@/lib/comments/request";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireCommentActor(request.headers);
    const length = Number(request.headers.get("content-length"));
    if (!Number.isSafeInteger(length) || length <= 0 || length > COMMENT_IMAGE_MAX_BYTES + 64 * 1024) throw new ValidationCommentError("ไฟล์อัปโหลดต้องมีขนาดไม่เกิน 3 MB");
    await consumeCommentLimit(actor, request.headers, "upload", length);
    const form = await readCommentFormData(request, COMMENT_IMAGE_MAX_BYTES + 64 * 1024);
    const file = form.get("file");
    if (!(file instanceof File)) throw new ValidationCommentError("กรุณาเลือกไฟล์รูป");
    const challengeToken = form.get("challengeToken");
    await ensureGuestVerification(actor, request.headers, typeof challengeToken === "string" ? challengeToken : undefined);
    const asset = await createCommentAsset(actor, file);
    return NextResponse.json(asset, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return handleCommentError(error); }
}

