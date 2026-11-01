export const MANGA_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const MANGA_UPLOAD_MAX_BODY_BYTES = MANGA_IMAGE_MAX_BYTES + 64 * 1024;
export const MANGA_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"] as const;
export const MANGA_IMAGE_ACCEPT = MANGA_IMAGE_TYPES.join(",");

export function mangaImageSelectionError(file: Pick<File, "name" | "size" | "type">): string | null {
  if (!file.size) return `${file.name}: ไฟล์ว่าง`;
  if (file.size > MANGA_IMAGE_MAX_BYTES) return `${file.name}: รูปต้องมีขนาดไม่เกิน 4 MiB`;
  if (!MANGA_IMAGE_TYPES.some(type => type === file.type))
    return `${file.name}: รองรับเฉพาะ JPEG, PNG, WebP, GIF และ AVIF`;
  return null;
}
