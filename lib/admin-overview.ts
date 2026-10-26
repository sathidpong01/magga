import { db } from "@/db";
import { sql } from "drizzle-orm";
/** Bounded scalar aggregates: never transfer thousands of IDs just to count them. */
export async function readAdminOverview() {
  const [row] = await db.execute<Record<string, number>>(sql`
    select
      (select count(*)::int from (select id from manga limit 1000) q) as manga,
      (select count(*)::int from (select id from manga where is_hidden=true limit 1000) q) as drafts,
      (select count(*)::int from (select id from profiles limit 1000) q) as users,
      (select count(*)::int from (select id from comments limit 1000) q) as comments,
      (select count(*)::int from (select id from categories limit 1000) q) as categories,
      (select count(*)::int from (select id from tags limit 1000) q) as tags,
      (select count(*)::int from (select id from manga_submissions where status='PENDING' limit 1000) q) as pending,
      (select count(*)::int from (select id from private.comment_reports where status='open' limit 1000) q) as reports,
      (select count(*)::int from (select id from mcp_metadata_drafts where status='pending' limit 1000) q) as proposals
  `);
  return row;
}
export function boundedAdminCount(value: number) {
  return value >= 1000 ? "1000+" : String(value);
}
