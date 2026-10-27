import { db } from "@/db";
import { sql } from "drizzle-orm";
import { bangkokDay, shiftDay, dailyPoints, historyWindow, type HistoryPeriod, type ViewHistory, type ViewSummary } from "./view-history";

export function historyUnavailable(error: unknown): boolean {
  const value = error as { code?: string; cause?: unknown } | null;
  return value?.code === "42P01" || Boolean(value?.cause && historyUnavailable(value.cause));
}

// One bounded lookup for the visible page, not one query per thumbnail.
export async function readViewSummaries(ids: string[], now = new Date()): Promise<Record<string, ViewSummary>> {
  if (!ids.length) return {};
  if (ids.length > 50) throw new Error("History page exceeds limit");
  const to = bangkokDay(now), from = shiftDay(to, -6);
  try {
    const rows = await db.execute<{ manga_id: string; started_at: string; baseline_views: string; day: string | null; views: string | null }>(sql`
      SELECT t.manga_id,t.started_at,t.baseline_views,d.day,d.views
      FROM manga_view_tracking t LEFT JOIN manga_view_daily d ON d.manga_id=t.manga_id AND d.day BETWEEN ${from}::date AND ${to}::date
      WHERE t.manga_id IN (${sql.join(ids.map(id => sql`${id}::uuid`), sql`,`)})
    `);
    const grouped = new Map<string, { startedAt: string; baselineViews: number; values: Map<string, number> }>();
    for (const row of rows) {
      let group = grouped.get(row.manga_id);
      if (!group) { group = { startedAt: new Date(row.started_at).toISOString(), baselineViews: Number(row.baseline_views), values: new Map() }; grouped.set(row.manga_id, group); }
      if (row.day) group.values.set(String(row.day).slice(0, 10), Number(row.views));
    }
    return Object.fromEntries([...grouped].map(([id, group]) => [id, { startedAt: group.startedAt, baselineViews: group.baselineViews, points: dailyPoints(from, to, group.startedAt, group.values) }]));
  } catch (error) { if (historyUnavailable(error)) return {}; throw error; }
}

export async function readViewHistory(id: string, period: HistoryPeriod, now = new Date()): Promise<ViewHistory | null> {
  const [tracking] = await db.execute<{ started_at: string; baseline_views: string; created_at: string }>(sql`SELECT t.started_at,t.baseline_views,m.created_at FROM manga_view_tracking t JOIN manga m ON m.id=t.manga_id WHERE t.manga_id=${id}::uuid`);
  if (!tracking) return null;
  const startedAt = new Date(tracking.started_at).toISOString();
  const window = historyWindow(period, startedAt, now, new Date(tracking.created_at).toISOString());
  const rows = await db.execute<{ day: string; views: string; hours: Record<string, number> }>(sql`
    SELECT (${window.from}::date + (floor((day-${window.from}::date)::numeric/${window.bucketDays})::int * ${window.bucketDays}))::text AS day,
      sum(views)::text AS views, ${period === "1" ? sql`(array_agg(hours))[1]` : sql`'{}'::jsonb`} AS hours
    FROM manga_view_daily WHERE manga_id=${id}::uuid AND day BETWEEN ${window.from}::date AND ${window.to}::date GROUP BY 1 ORDER BY 1
  `);
  const [peak] = await db.execute<{ day: string; views: string }>(sql`SELECT day::text,views::text FROM manga_view_daily WHERE manga_id=${id}::uuid AND day BETWEEN ${window.from}::date AND ${window.to}::date ORDER BY views DESC,day ASC LIMIT 1`);
  const hourly = period === "1";
  const points = hourly ? Array.from({ length: 24 }, (_, hour) => {
    const date = `${window.to}T${String(hour).padStart(2, "0")}:00:00+07:00`;
    const startHour = new Date(date).getTime();
    return { date, views: startHour > now.getTime() || startHour + 3_600_000 <= Date.parse(startedAt) ? null : Number(rows[0]?.hours?.[String(hour)] ?? 0) };
  }) : dailyPoints(window.from, window.to, startedAt, new Map(rows.map(row => [row.day, Number(row.views)])), window.bucketDays);
  return { ...window, startedAt, baselineViews: Number(tracking.baseline_views), points, hourly, total: rows.reduce((sum, row) => sum + Number(row.views), 0), peak: peak ? { date: peak.day, views: Number(peak.views) } : null };
}
