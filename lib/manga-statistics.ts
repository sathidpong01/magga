import type { db } from "@/db";
import { manga, mangaRatings, mangaViews } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function recordMangaRating(database: Pick<typeof db, "transaction">, id: string, rating: number, fingerprint: string, ipAddress: string) {
  return database.transaction(async tx => {
    // All voters for a work lock the same row before reading aggregates or votes.
    const [work] = await tx.select({ ratingSum: manga.ratingSum, ratingCount: manga.ratingCount })
      .from(manga).where(and(eq(manga.id, id), eq(manga.isHidden, false))).for("update");
    if (!work) return null;
    const [existing] = await tx.select({ rating: mangaRatings.rating }).from(mangaRatings)
      .where(and(eq(mangaRatings.mangaId, id), eq(mangaRatings.fingerprint, fingerprint)));
    await tx.insert(mangaRatings).values({ mangaId: id, fingerprint, ipAddress, rating })
      .onConflictDoUpdate({ target: [mangaRatings.mangaId, mangaRatings.fingerprint], set: { rating, ipAddress, updatedAt: new Date().toISOString() } });
    const ratingSum = Number(work.ratingSum) + rating - (existing?.rating ?? 0);
    const ratingCount = Number(work.ratingCount) + (existing ? 0 : 1);
    const averageRating = ratingCount ? ratingSum / ratingCount : 0;
    await tx.update(manga).set({ ratingSum, ratingCount, averageRating }).where(eq(manga.id, id));
    return { averageRating, ratingCount, userRating: rating, message: existing ? "Rating updated" : "Rating added" };
  });
}

export async function recordMangaView(database: Pick<typeof db, "transaction">, id: string, viewerKey: string) {
  return database.transaction(async tx => {
    const [work] = await tx.select({ viewCount: manga.viewCount }).from(manga)
      .where(and(eq(manga.id, id), eq(manga.isHidden, false))).for("update");
    if (!work) return null;
    const marker = (key: string) => tx.insert(mangaViews).values({ mangaId: id, ipHash: key, viewedAt: new Date() })
      .onConflictDoUpdate({ target: [mangaViews.mangaId, mangaViews.ipHash], set: { viewedAt: sql`NOW()` }, setWhere: sql`${mangaViews.viewedAt} < NOW() - INTERVAL '10 minutes'` })
      .returning({ viewerKey: mangaViews.ipHash });
    const fresh = (await marker(viewerKey)).length > 0;
    if (!fresh) return { viewCount: Number(work.viewCount), deduplicated: true };
    const [updated] = await tx.update(manga).set({ viewCount: sql`${manga.viewCount} + 1` }).where(eq(manga.id, id)).returning({ viewCount: manga.viewCount });
    return { viewCount: Number(updated.viewCount), deduplicated: false };
  });
}
