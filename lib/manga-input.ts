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
  authorName: z.string().max(200).nullish(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});
export const bulkMangaSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(200).transform(ids => [...new Set(ids)]),
  action: z.enum(["delete", "show", "hide"]),
});
