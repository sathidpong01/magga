import { z } from "zod";

export const mangaInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(10000).optional(),
  categoryId: z.uuid().nullish(),
  authorId: z.uuid().nullish(),
  selectedTags: z.array(z.uuid()).max(100).transform(ids => [...new Set(ids)]),
  coverImage: z.url().optional(),
  pages: z.array(z.url()).max(1000).optional(),
  isHidden: z.boolean().optional(),
  scheduledPublishAt: z.iso.datetime({ offset: true }).nullable().optional(),
  publicationTimeZone: z.string().max(100).refine(value => {
    try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; }
    catch { return false; }
  }, "เขตเวลาไม่ถูกต้อง").nullable().optional(),
  authorName: z.string().max(200).nullish(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
}).superRefine((data, context) => {
  if (data.scheduledPublishAt) {
    if (Date.parse(data.scheduledPublishAt) <= Date.now())
      context.addIssue({ code: "custom", path: ["scheduledPublishAt"], message: "กรุณาเลือกเวลาหลังเวลาปัจจุบันของระบบ" });
    if (!data.publicationTimeZone)
      context.addIssue({ code: "custom", path: ["publicationTimeZone"], message: "กรุณาระบุเขตเวลาของผู้ตั้งเวลา" });
    if (data.isHidden === false)
      context.addIssue({ code: "custom", path: ["isHidden"], message: "เรื่องที่ตั้งเวลาต้องยังไม่เผยแพร่" });
  } else if (data.publicationTimeZone != null) {
    context.addIssue({ code: "custom", path: ["scheduledPublishAt"], message: "กรุณาระบุเวลาเผยแพร่" });
  }
});

export function mangaPublicationValues(data: z.infer<typeof mangaInputSchema>) {
  if (data.scheduledPublishAt) return {
    isHidden: true,
    scheduledPublishAt: new Date(data.scheduledPublishAt).toISOString(),
    publicationTimeZone: data.publicationTimeZone,
  };
  if (data.isHidden !== undefined || data.scheduledPublishAt === null) return {
    isHidden: data.isHidden ?? true,
    scheduledPublishAt: null,
    publicationTimeZone: null,
  };
  // Ordinary content edits preserve any schedule/visibility changed by another admin.
  return {};
}
export const bulkMangaSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(200).transform(ids => [...new Set(ids)]),
  action: z.enum(["delete", "show", "hide"]),
});
