import { pgTable, uuid, timestamp, bigint, date, jsonb, primaryKey, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { manga } from "./schema";

export const mangaViewTracking = pgTable("manga_view_tracking", {
  mangaId: uuid("manga_id").primaryKey().references(() => manga.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  baselineViews: bigint("baseline_views", { mode: "number" }).default(0).notNull(),
}).enableRLS();

export const mangaViewDaily = pgTable("manga_view_daily", {
  mangaId: uuid("manga_id").notNull().references(() => manga.id, { onDelete: "cascade" }),
  day: date().notNull(),
  views: bigint({ mode: "number" }).default(0).notNull(),
  hours: jsonb().$type<Record<string, number>>().default({}).notNull(),
}, table => [
  primaryKey({ columns: [table.mangaId, table.day] }),
  check("manga_view_daily_views_check", sql`${table.views} >= 0`),
]).enableRLS();
