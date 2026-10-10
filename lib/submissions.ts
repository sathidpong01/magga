import { z } from "zod";
import { db } from "@/db";
import { manga, mangaSubmissions, mangaSubmissionTags, userSubmissionLimits } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export const submissionSchema = z.object({
  title: z.string().trim().min(1).max(200), slug: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(5000).optional(), coverImage: z.string().url(),
  pages: z.array(z.string().url()).min(1).max(150),
  categoryId: z.string().uuid().nullable().optional(), authorId: z.string().uuid().nullable().optional(),
  tagIds: z.array(z.string().uuid()).max(100).transform(ids => [...new Set(ids)]).optional(),
  extraMetadata: z.string().max(10000).optional(), status: z.enum(["PENDING"]).default("PENDING"),
});
export class SubmissionQuotaError extends Error {}
/** Midnight Asia/Bangkok, irrespective of the server timezone. */
export function submissionDayStart(now = new Date()): string {
  const shifted = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - 7 * 60 * 60 * 1000).toISOString();
}
export async function createSubmission(userId: string, data: z.output<typeof submissionSchema>) {
  return db.transaction(async tx => {
    const now = new Date().toISOString(), dayStart = submissionDayStart(new Date(now));
    // The unique user conflict locks this row; tag failures roll back the quota.
    const [quota] = await tx.insert(userSubmissionLimits).values({ userId, submissionCount: 1, windowStart: dayStart, lastSubmitAt: now })
      .onConflictDoUpdate({ target: userSubmissionLimits.userId,
        set: {
          submissionCount: sql`CASE WHEN ${userSubmissionLimits.windowStart} < ${dayStart}::timestamptz THEN 1 ELSE ${userSubmissionLimits.submissionCount} + 1 END`,
          windowStart: dayStart, lastSubmitAt: now,
        },
        setWhere: sql`${userSubmissionLimits.windowStart} < ${dayStart}::timestamptz OR ${userSubmissionLimits.submissionCount} < 5`,
      }).returning({ id: userSubmissionLimits.id });
    if (!quota) throw new SubmissionQuotaError("Daily submission limit reached (5/5). Please try again tomorrow.");
    let slug = data.slug || data.title.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\-\u0E00-\u0E7F]+/g, "").replace(/-+/g, "-") || randomUUID();
    const [existing] = await tx.select({ id: manga.id }).from(manga).where(eq(manga.slug, slug)).limit(1);
    if (existing) slug = `${slug}-${randomUUID()}`;
    const { tagIds, pages, ...values } = data;
    const [submission] = await tx.insert(mangaSubmissions).values({ ...values, userId, slug, pages: JSON.stringify(pages) }).returning();
    if (tagIds?.length) await tx.insert(mangaSubmissionTags).values(tagIds.map(tagId => ({ submissionId: submission.id, tagId })));
    return submission;
  });
}
