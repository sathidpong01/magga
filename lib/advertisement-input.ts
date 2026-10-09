import { z } from "zod";
import { adDevices, adPlacements, maxAdvertisementLinks, normalizeAdvertisementLink } from "./advertisements";

const destination = z.string().trim().transform((value, ctx) => {
  const normalized = normalizeAdvertisementLink(value);
  if (!normalized) {
    ctx.addIssue({ code: "custom", message: "ใช้ URL แบบ http:// หรือ https:// ที่ไม่มีชื่อผู้ใช้หรือรหัสผ่านเท่านั้น" });
    return z.NEVER;
  }
  return normalized;
});

const advertisementFields = z.object({
  type: z.enum(["affiliate", "promptpay"]),
  title: z.string().trim().min(1).max(200),
  imageUrl: z.union([
    z.url().max(2048).refine((url) => /^https?:\/\//i.test(url)),
    z.string().max(2048).regex(/^\/(?!\/)/),
  ]),
  linkUrl: z.union([destination, z.string().trim().length(0), z.null()]).optional(),
  linkUrls: z.array(destination).max(maxAdvertisementLinks, "เพิ่มลิงก์ได้สูงสุด 20 ลิงก์").transform((links) => [...new Set(links)]).optional(),
  content: z.string().max(5000).nullable().optional(),
  placement: z.enum(adPlacements),
  repeatCount: z.number().int().min(1).max(10),
  isActive: z.boolean(),
  targetDevice: z.enum(adDevices),
});

function preferLinkUrls(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value) && "linkUrls" in value) {
    const copy = { ...value };
    delete (copy as Record<string, unknown>).linkUrl;
    return copy;
  }
  return value;
}

function synchronizeLinks<T extends { linkUrls?: string[]; linkUrl?: string | null }>(data: T) {
  if (data.linkUrls !== undefined) return { ...data, linkUrl: data.linkUrls[0] ?? null };
  if (data.linkUrl !== undefined) return { ...data, linkUrl: data.linkUrl || null, linkUrls: data.linkUrl ? [data.linkUrl] : [] };
  return data;
}

export const advertisementInput = z.preprocess(preferLinkUrls, advertisementFields.extend({
  repeatCount: advertisementFields.shape.repeatCount.default(1),
  isActive: advertisementFields.shape.isActive.default(false),
  targetDevice: advertisementFields.shape.targetDevice.default("all"),
}).transform((data) => synchronizeLinks({ ...data, linkUrls: data.linkUrls ?? (data.linkUrl ? [data.linkUrl] : []) })));
export const advertisementUpdate = z.preprocess(preferLinkUrls, advertisementFields.partial().transform(synchronizeLinks));
export const adEventInput = z.object({
  eventId: z.uuid(),
  kind: z.enum(["impression", "click"]),
});
