# Advertisement Management

Before deploying multiple-destination support, apply the SQL from
`db/migrations/0014_advertisement_links.sql` to the confirmed target Supabase
project using MCP `apply_migration` with the name `advertisement_links`.
Check Supabase migration history and the live column first. This checkout lacks
historical migration files `0000`–`0003`, so `bun run db:migrate` cannot read the
complete journal; do not use it to apply this pending production change.
The migration adds `link_urls` and
conservatively copies safe existing HTTP(S) destinations into a one-item array.
The legacy `link_url` column is preserved, including unsupported values; clients
filter unsafe destinations before rendering or opening them. Reapplying this SQL
does not overwrite later edits or restore cleared destinations.

Verify that `public.advertisements.link_urls` is `jsonb NOT NULL DEFAULT '[]'`,
safe legacy links appear in one-item arrays, and the original advertisement
count is preserved. The migration does not assign `link_url` or campaign fields;
the existing `set_updated_at` trigger updates timestamps on backfilled rows.
Keep the column when rolling back app code so the old client
can continue using `link_url` without losing the new destinations.

On 2026-10-09, this migration was applied to production `magga-db`
(`ssgsxrdobafxkiuigoqw`) through Supabase MCP. All five existing advertisements
received their legacy destination in `link_urls`; all five rows remain and
the existing trigger refreshed their `updated_at` timestamps. Supabase recorded
this as migration `20261009081936_advertisement_links`. Future deployments should
verify the target project's live schema and migration history rather than
assuming this record applies to every environment.

## Release checklist

- Validate the working branch with Bun tests, lint, and type checking. The
  disposable build verifies production compilation without production writes.
- Commit the complete feature and migration, then push the feature branch for
  Vercel Preview. GitHub CI is optional; it is not required for this release.
- Use the disposable local test database to verify adding, editing, clearing,
  and duplicating destination lists, without changing live campaigns. Check
  banner, grid, modal, and floating placements with fixture campaigns: each
  click must select one destination and open one tab, including keyboard,
  Ctrl/Cmd-click, and middle-click activation. Use Preview for read-only checks
  when its database is shared with production.
- Merge into `main` after Preview validation, verify the resulting Vercel
  deployment, and smoke-test the admin form and public placements. Confirm that
  old single-destination advertisements still work.
- If the app needs rollback, redeploy the previous app revision and retain
  `link_urls`. Do not drop the column or replay historical migrations.

Create and update requests accept `linkUrls`, an array of up to 20 absolute
HTTP(S) URLs without embedded credentials. URLs are trimmed, normalized, and
deduplicated in order. An explicitly supplied array takes precedence over
`linkUrl`; `[]` clears all destinations. The legacy `linkUrl` mirrors the first
destination or `null`. Older clients can still submit `linkUrl` to replace the
array with one destination or clear it with `null`/an empty string. Updates that
omit both fields preserve the destinations. Public and management responses
include `linkUrls`.

Each activation chooses one destination with equal probability, then records
the click and opens that destination. Destinations are selected per click, not
per render or page visit. Ads with no safe destination remain non-clickable.

Before deploying version 2.21.0 to a project without advertisement management,
apply only the pending advertisement-management SQL through the project's
established migration procedure. Migration
`0012_advertisement_management` adds device targeting, cumulative counters, and
the event deduplication table. Existing advertisements keep their active state
and display on all devices. No existing campaign data is removed.

New advertisements and duplicates start inactive (draft). Duplicates copy the
creative, destination, placement, device, and repeat count; their counters start
at zero. The management form's active switch controls publication. Mobile means
viewports below 900px; desktop means 900px and above, including larger tablets.

An impression counts when a loaded image is at least 50% visible for one
continuous second in a visible browser tab. Clicking earlier also records an
impression. Each rendered advertisement counts at most one impression and one
click per page visit. Repeated grid placements are separate rendered exposures.
CTR is clicks divided by impressions. Dashboard previews do not count. Counters
start at zero when this feature is deployed; historical traffic is not imported.

Public event requests are rate limited and deduplicated. They contain anonymous
event UUIDs, not account IDs. The existing authenticated daily cleanup removes
event UUIDs older than 30 days while preserving cumulative campaign counters.
`CRON_SECRET` must be configured for cleanup to run.

The server shares a five-minute cache between the API, page layout, and homepage
grid. Management writes invalidate it immediately. Initial ads are included in
server-rendered pages. Client refreshes occur on navigation or window focus
after a 30-second freshness interval; concurrent refresh requests are merged and
hidden tabs do not fetch. Header images load eagerly; lower banners and grid
images load lazily into reserved dimensions.
