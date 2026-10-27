export const historyPeriods = ["1", "7", "30", "90", "365", "all"] as const;
export type HistoryPeriod = typeof historyPeriods[number];
export type ViewPoint = { date: string; views: number | null };
export type ViewSummary = { startedAt: string; baselineViews: number; points: ViewPoint[] };
export type ViewHistory = ViewSummary & {
  from: string; to: string; bucketDays: number; hourly: boolean;
  total: number; peak: { date: string; views: number } | null;
};
const dayMs = 86_400_000;
export function bangkokDay(now = new Date()) { return new Date(now.getTime() + 7 * 3_600_000).toISOString().slice(0, 10); }
export function shiftDay(day: string, offset: number) { return new Date(Date.parse(day + "T00:00:00Z") + offset * dayMs).toISOString().slice(0, 10); }
export function historyWindow(period: HistoryPeriod, startedAt: string, now = new Date(), publishedAt = startedAt) {
  const to = bangkokDay(now), started = bangkokDay(new Date(publishedAt));
  const from = period === "all" ? started : shiftDay(to, 1 - Number(period));
  const days = Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / dayMs) + 1);
  return { from, to, bucketDays: Math.max(1, Math.ceil(days / 366)), days };
}
export function dailyPoints(from: string, to: string, startedAt: string, values: Map<string, number>, bucketDays = 1): ViewPoint[] {
  const started = bangkokDay(new Date(startedAt));
  const points: ViewPoint[] = [];
  for (let date = from; date <= to; date = shiftDay(date, bucketDays)) {
    const end = shiftDay(date, bucketDays - 1);
    points.push({ date, views: end < started ? null : values.get(date) ?? 0 });
  }
  return points;
}
