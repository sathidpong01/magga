# Mobile reader and Hobby resource improvements — v2.26.0

## Scope

Implements the approved mobile-reader plan with the owner's excluded feature removed. No bookmark/read-later UI, API, storage key or schema was introduced. Existing charcoal/Archive Gold/Kanit styling and the manga card anatomy are retained.

## Changes

- Browser Back restores up to five catalog batches (60 cards) and the saved scroll position. Session cache expires after ten minutes and is capped at 200KB. A single bounded public lookup validates restored cards against the current content cache; hidden/deleted cards are omitted. Content invalidation uses the existing `manga-list` tag.
- Mobile reader headers use a small portrait cover, title/credits, aggregate rating and one start/resume action. Description, taxonomy and full credits use native expandable details. Desktop keeps its background and portrait cover without stretching.
- Failed reader images keep a placeholder and provide an explicit retry for that image. Retries reuse the original URL and do not reload the work or generate cache-busting variants.
- Rating identity loads on explicit intent, not simply when the rating enters the viewport. Stars have 44px targets, selected state, loading and actionable failure feedback. Aggregate updates are shared between the header and footer in browser memory without an extra request.
- Main comments request ten roots and batched reply counts. Replies load ten at a time only when opened; the legacy API's eager-reply default remains compatible with existing clients. Private capabilities stay batched and uncached.
- Comment mutations update local records and preserve loaded roots/replies instead of reloading the first batch. Reply toggles retain their drafts. Text/name drafts are isolated by actor, work, page and parent in sessionStorage, with a 24-hour TTL, 20-entry/50KB cap and best-effort recovery when storage is unavailable.
- A compact home resume row uses existing local progress, with metadata captured during public reading. Hidden previews do not save resume metadata. A small head bootstrap reserves the optional row's space before paint and records traversal intent before the App Router handles it; no server cookie or dynamic home session is required.
- Related works are explicitly requested from the footer, limited to four results and backed by a 300-second public Data Cache. Hidden source works return 404; content withdrawals invalidate the existing cache tag.
- Category and tag pages now use twelve-item server batches with stable ordering and previous/next links. Subsequent pages are noindex/follow. The existing encoded-name decoder and dynamic route behavior remain intact.
- Cookie consent waits for age verification; reading progress respects the bottom safe area.

## Resource boundaries

No new dependency, database migration, queue, cron, realtime connection, polling or custom analytics collector was added. Original reader images remain direct R2 URLs and unoptimized, preserving text quality and avoiding per-read transformations. Existing image width/quality variants, view deduplication, rate limits, private no-store responses, consent rules and Speed Insights sampling remain in place.

Home restoration deliberately performs one validation request. This trades a bounded lookup for correctness after withdrawal; it does not promise a completely request-free Back navigation. Related results load only on a click. Comments remain behind the existing lazy boundary.

## Verification and deployment gates

Use Bun 1.4.2 and the frozen lockfile. Tests cover storage corruption/expiry/bounds/identity separation, legacy reading progress, taxonomy pagination, restoration/related withdrawal and count-only comment batches with real disposable SQL. Browser verification uses a freshly created PGlite socket with synthetic works and guest identities, never production credentials.

Completed local validation: frozen install/runtime check, lint, typecheck, 540 passing tests (1,697 assertions across 73 files), and production build. Browser checks at 320, 360, 390, 768 and 1,440px found no horizontal overflow on home/reader. Back restored 24 cards with one restore request. Comments and rating made zero API requests before their respective lazy/intent boundaries; replies loaded ten on demand. Related works made zero requests before the click and one request returning four cards afterward. Synthetic guest create/edit/delete returned 200; successful submission cleared its draft. Draft recovery, 44px rating targets, rating-error feedback and single-image retry were also verified. Local screenshots and browser scripts/logs are retained in the ignored `output/playwright/mobile-review-20261026/v226/` folder.

The Vercel observability MCP query and scoped CLI metrics call both returned invalid-request errors while collecting a new usage baseline. Actual account usage, CPU savings and quota headroom are therefore unverified. The earlier October 9 usage snapshot is not treated as current. Compare normalized route usage and the actual quota windows after an authorized deployment.

Production Lighthouse from the preceding audit is a baseline, not evidence of this undeployed patch's performance. Local synthetic-image layouts/network counters prove behavior, not real-device Core Web Vitals. Android/iPhone/Facebook/Samsung real-device testing, real Turnstile/Google OAuth/R2 uploads and production post-deployment sampling remain release checks.

The plan's conditional investigations remain separate: ad asset recompression requires reviewing the actual source assets; reader downscaling needs text-quality comparison; changing rating identity needs legacy-vote compatibility; indexes/keyset changes need an execution plan from representative data. They are not applied speculatively in this release.

Version was advanced with `bun run version minor`. Bun 1.4.2 does not serialize the root package version in this lockfile format, so the unchanged dependency lock is verified with a frozen install rather than adding an unsupported version field.
