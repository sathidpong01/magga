import { z } from "zod";
import { adDevices, adPlacements } from "./advertisements";

const advertisementFields = z.object({
  type: z.enum(["affiliate", "promptpay"]),
  title: z.string().trim().min(1).max(200),
  imageUrl: z.union([
    z.url().max(2048).refine((url) => /^https?:\/\//i.test(url)),
    z.string().max(2048).regex(/^\/(?!\/)/),
  ]),
  linkUrl: z.union([z.url().max(2048).refine((url) => /^https?:\/\//i.test(url)), z.literal(""), z.null()]).optional(),
  content: z.string().max(5000).nullable().optional(),
  placement: z.enum(adPlacements),
  repeatCount: z.number().int().min(1).max(10),
  isActive: z.boolean(),
  targetDevice: z.enum(adDevices),
});

export const advertisementInput = advertisementFields.extend({
  repeatCount: advertisementFields.shape.repeatCount.default(1),
  isActive: advertisementFields.shape.isActive.default(false),
  targetDevice: advertisementFields.shape.targetDevice.default("all"),
});
export const advertisementUpdate = advertisementFields.partial();
export const adEventInput = z.object({
  eventId: z.uuid(),
  kind: z.enum(["impression", "click"]),
});
