import { ValidationCommentError } from "./types";

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function requireUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) throw new ValidationCommentError(`${field} ไม่ถูกต้อง`);
  return value;
}
export function validateCommentContent(value: unknown, image = false): string {
  if (typeof value !== "string" || value.length > 500 || (!value.trim() && !image)) throw new ValidationCommentError("ต้องมีข้อความไม่เกิน 500 ตัวอักษรหรือรูปภาพ");
  return value.trim();
}
export function validateImageIndex(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new ValidationCommentError("หน้าการ์ตูนไม่ถูกต้อง");
  return value;
}
