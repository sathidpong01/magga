# Advertisement Management

Apply `npm run db:migrate` before deploying version 2.21.0. Migration
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
