import { sql, and, eq, or } from "drizzle-orm";
import { manga } from "@/db/schema";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

export async function publishScheduledManga(database: Pick<PgDatabase<PgQueryResultHKT>, "update">, invalidate: (slugs: string[]) => boolean) {
  const rows = await database.update(manga).set({
    isHidden: false,
    createdAt: sql`CASE WHEN is_hidden THEN scheduled_publish_at ELSE created_at END`,
    updatedAt: sql`CASE WHEN is_hidden THEN now() ELSE updated_at END`,
  }).where(sql`id IN (
      SELECT id FROM ${manga}
      WHERE scheduled_publish_at <= now()
      ORDER BY scheduled_publish_at, id LIMIT 100
      FOR UPDATE SKIP LOCKED
    )`).returning({ id: manga.id, slug: manga.slug, scheduledPublishAt: manga.scheduledPublishAt });
  if (!rows.length) return { published: 0, cacheRefreshPending: false };

  // Keep due timestamps until caches acknowledge publication, so the next run retries failures.
  if (!invalidate(rows.map(row => row.slug))) return { published: rows.length, cacheRefreshPending: true };
  await database.update(manga).set({ scheduledPublishAt: null, publicationTimeZone: null })
    .where(and(eq(manga.isHidden, false), or(...rows.map(row => and(eq(manga.id, row.id), sql`${manga.scheduledPublishAt} = ${row.scheduledPublishAt}::timestamptz`)))));
  return { published: rows.length, cacheRefreshPending: false };
}
