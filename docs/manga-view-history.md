# Manga view history (2.29.3)

The admin manga list shows a seven-day sparkline beneath each lifetime view count. Selecting it opens a keyboard-accessible dialog with today's hourly totals, 7/30/90/365-day ranges, or the period since publication. Exact values are available in an expandable table. Daily peak selection remains exact even when the lifetime chart groups several days into each plotted point.

## Meaning and cost

- Counts use the existing accepted-view definition: the same visitor/work is deduplicated for ten minutes. These are counted reads, not unique people.
- All dates use Asia/Bangkok. Today and the first tracking day may be incomplete. Future hours and dates before tracking are unknown, not zero.
- Existing lifetime totals are retained as the baseline when collection starts. The prior dedup table retains only the most recent visit per key, so earlier daily activity cannot be reconstructed accurately.
- Storage is one row per work with coverage metadata, plus one row per work/day with accepted activity. Each daily row contains at most 24 hourly counters. No new visitor identifiers, per-visit event log, background worker, cron schedule, chart library or paid service is introduced.
- The database trigger updates one daily row in the same transaction as the lifetime increment. Deduplicated requests do not update history. Transaction rollback also rolls back the counters and dedup marker.
- The visible manga page loads its seven-day summaries in one extra indexed query for at most 50 works (at most 350 daily records). No client history API requests run on initial page load. Modal detail is fetched only when opened or its period changes; requests are aborted on close/change. Output is capped at 366 chart points, with larger date buckets for long histories. Lifetime queries read the selected work's retained daily rows; their cost still grows with that work's age.
- The new endpoint requires fresh admin authorization and uses private/no-store responses. New tables enable RLS and deny public access. The direct database role must own/bypass RLS on the tables, as in the existing server-side database workflow.

## Database rollout

Migration: `db/migrations/0015_manga_view_history.sql`, journal entry 0015.

The migration creates `manga_view_tracking`, `manga_view_daily`, the `capture_manga_view_history` trigger function, and the `manga_view_history_capture` trigger on inserts/view-count updates. Existing manga receive coverage metadata at migration time without inventing daily values; newly inserted manga receive coverage metadata at insertion time.

Before applying to a deployed database, prove the intended project/database and current migration history, inspect the live `manga` schema, confirm both new tables and the trigger are absent, and use the database owner with a transaction covering the entire migration. This checkout lacks historical migration files 0000–0003: do not blindly run the full migration chain against an existing database. Never run the disposable schema-push workflow against production.

After applying, verify that the trigger is enabled, the number of coverage rows matches the existing manga count, and a controlled accepted-view increment increases the daily/hourly total once while a deduplicated repeat leaves it unchanged. Retain the baseline totals. A safe rollback can disable the new trigger while preserving its collected data and the existing lifetime counter; a destructive table rollback is unnecessary.

The application tolerates deployment before the migration: normal views/rating behavior remains independent of the new tables. Admin lists still load, and the history dialog explains that collection has not been enabled. Database failure unrelated to a missing table is not disguised as an empty history.

On 2026-10-27, the migration was applied to `magga-db` (`ssgsxrdobafxkiuigoqw`) after confirming both tables, the function and the trigger were absent. All 36 existing manga received coverage metadata with their original lifetime totals preserved. A transaction verified daily/hourly capture and unchanged counters on a no-increment update, then rolled back all probe changes. Collection starts at migration time; older daily totals remain unknown.

The admin overview also loads seven-day summaries for its ten popular manga with one bounded query. Each ranking offers the same history dialog as the manga list, outside the link to the work. Rankings continue to use lifetime views. Loading placeholders reserve space for the added charts; detail requests run only when a dialog opens.

The compact overview uses an inline moderation queue, removes the unavailable unique-visitor placeholders, and bounds top-three covers by viewport height while retaining their 3:4 ratio. The overview and manga table show a smooth curve with a subtle gold area and a seven-day total. The modal uses the same curve rendering. Curves connect only consecutive recorded days; unknown days remain gaps with muted baseline ticks in the preview. Recorded zero remains a gold point at zero. A single recorded day shows one point until another day is available. Hovering a day gives its date and value. Clicking the chart opens the existing period selector. Overview loading geometry shares the cover, card and ranking dimensions with the rendered page.

## Layout and validation

The overview's popular top-three section and its loading skeleton no longer stretch to match the seven-row ranking alongside it. Covers retain a 3:4 aspect ratio. Browser checks at 390, 768, 1024, 1280, 1440 and 1920 pixels found zero horizontal overflow, a cover ratio of approximately 0.75, and 11 pixels of trailing card padding rather than stretched blank card space.

555 tests passed, along with lint and a production build using a fresh disposable database. Focused tests execute the actual migration and verify baseline preservation, deduplication, atomic rollback, daily/hourly totals, unknown-date handling, lifetime bucketing, exact peaks, admin authorization, invalid periods and pre-migration fallback. The retained Drizzle schema-push fixture installs the same trigger function before creating synthetic manga; schema push alone does not install triggers.

Browser checks verified all period choices, zero initial detail requests, keyboard opening/Escape closing, mobile fullscreen presentation, the detail table, and recovery from a synthetic 503. A console 503 during that intentional failure case is expected; no uncaught page errors were observed. Local screenshots and QA scripts are under ignored `output/playwright/admin-review-20261026/history-*`.

These are functional checks, not a production traffic/load benchmark or a guarantee of zero hosting cost.
