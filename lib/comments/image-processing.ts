import sharp from "sharp";
import { readValidatedImageFile } from "@/lib/image-security";
import { ValidationCommentError } from "./types";

export const COMMENT_IMAGE_MAX_BYTES = 3 * 1024 * 1024;
const MAX_PIXELS = 20_000_000;
const MAX_FRAMES = 60;
const MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

/** Re-encoding removes metadata and trailing payload; SVG is never accepted. */
export async function processCommentImage(file: File) {
  if (!file.size || file.size > COMMENT_IMAGE_MAX_BYTES) throw new ValidationCommentError("รูปต้องมีขนาดไม่เกิน 3 MB");
  try {
    const { buffer } = await readValidatedImageFile(file, { maxBytes: COMMENT_IMAGE_MAX_BYTES, allowedMimeTypes: MIME_TYPES });
    const image = sharp(buffer, { animated: true, limitInputPixels: MAX_PIXELS, failOn: "warning" });
    const metadata = await image.metadata();
    const frames = metadata.pages || 1;
    const height = metadata.pageHeight || metadata.height || 0;
    if (!metadata.width || !height || frames > MAX_FRAMES || metadata.width * height * frames > MAX_PIXELS) throw new Error("Image decode budget exceeded");
    const { data, info } = await image.timeout({ seconds: 8 }).rotate().resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true }).webp({ quality: 50, effort: 4 }).toBuffer({ resolveWithObject: true });
    if (!data.length || data.length > COMMENT_IMAGE_MAX_BYTES) throw new Error("Encoded image exceeds budget");
    const outputMetadata = await sharp(data, { animated: true }).metadata();
    return { data, contentType: "image/webp" as const, bytes: data.length, width: info.width, height: outputMetadata.pageHeight || info.height };
  } catch (error) {
    if (error instanceof ValidationCommentError) throw error;
    throw new ValidationCommentError("ไฟล์รูปไม่ถูกต้อง รองรับ JPG, PNG, WebP และ GIF ขนาดไม่เกิน 3 MB");
  }
}
