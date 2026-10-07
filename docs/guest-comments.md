# Guest comments — version 2.23.0

Guests can post text, attach an image, reply, report abuse, and manage their own
published comments without registering. Member commenting, voting, profiles,
and blocking remain available. Guest voting stays disabled to reduce vote manipulation.

## Identity and usability

- The first submission creates an identity only after server-side Turnstile
  verification. Merely opening or reading a page creates no guest rows.
- An optional nickname has a 40-character limit. Text has a 500-character limit.
- A random opaque cookie lasts 180 days: HttpOnly, SameSite=Lax, path `/`, and
  Secure with the `__Host-` prefix in production. The database stores only its hash.
- Identity belongs to the same browser profile. Clearing cookies, using incognito,
  or switching browsers loses the ability to manage old guest comments. It does
  not identify a physical device or provide account recovery.
- Verification is reused for ten minutes; expired verification requires another
  challenge. The identity cookie and previously posted comments remain intact.
- Draft text, selected file, uploaded asset ID and submission idempotency key are
  retained on failure. Requests with the same key and payload return the existing
  comment; changed payloads cannot reuse that key.
- Guest names and codes appear in public comments. Guest ownership IDs, session
  IDs, hashes and voter arrays do not enter public responses or SSR props.
  Published image URLs intentionally expose their random public R2 object key.
- Public threads have cursor pagination with PostgreSQL timestamp precision and
  UUID tie breakers. The first twenty replies include a continuation button.
- Deleting a comment leaves a placeholder and preserves replies by other authors.
  Owner and admin deletion erase the body, image reference and tracked R2 files
  immediately. That content cannot be restored.

## Abuse controls

Limits are shared PostgreSQL counters, enforced atomically across instances and
concurrent requests. A failed database check refuses the write.

| Action | Per identity / 15 minutes | Burst / 30 seconds |
| --- | ---: | ---: |
| Comment | 20 | 4 |
| Upload | 10 and 30 MiB total request bytes | 4 |
| Vote / report | 10 | 4 |
| Admin moderation | 100 | 20 |
| Guest creation, per trusted network | 100 | 20 |

On Vercel, only `x-vercel-forwarded-for` supplies the network identity. Spoofable
client forwarded headers are ignored. A missing trusted edge header refuses
writes. Network addresses are HMAC hashes, not plain IP values. Per-action network
limits are 200 requests and 300 MiB per fifteen minutes.

New comments and edits publish immediately, including messages containing links.
There is no review queue, hide action or manual publication action. Admins can
permanently delete, ban/unban a guest, and resolve/dismiss deduplicated reports.
Legacy status values remain in the schema for read compatibility, but hide and
publish requests are rejected. Deleted comments cannot be restored. Mutations record
moderation events and check the current member role/ban state in the database.
A banned guest's retained cookie grants no rights; it does not block a valid
member from managing that member's own comments.

Origin checks use configured application/deployment origins. Turnstile verification
checks success, the exact expected hostname and action `comment`, and has a
ten-second timeout. Missing configuration and upstream failure do not bypass it.
JSON bodies are bounded at 8 KiB before parsing, including streamed requests.
Multipart bodies are bounded by actual streamed bytes before decoding, and
their declared length must match; a forged short header cannot bypass the bound.

A person who clears cookies can obtain a different guest identity. Turnstile,
network limits and moderation reduce that abuse; cookies do not make guest bans
equivalent to verified account bans.

## Image handling

- JPEG, PNG, WebP and GIF, at most 3 MiB input and processed output.
- MIME and file signatures must agree. SVG, HTML, mismatches and invalid images
  are rejected. Sharp decodes and re-encodes to WebP, strips metadata, rotates EXIF,
  and scales inside 800×800 without enlarging, at WebP quality 50. This quality
  setting does not guarantee a file half the original size. Only newly uploaded
  comment images use this preset; manga images and existing objects are unchanged.
- Maximum 20 million decoded pixels across frames, sixty frames, and an
  eight-second processing timeout. Animation is preserved within these bounds.
- Three unexpired unattached/reserved uploads per identity. A reservation precedes
  expensive processing, so concurrent uploads cannot bypass the staged limit.
- Assets expire after 24 hours if unused. Attaching checks owner, expiry and state
  within the comment transaction; an asset cannot be attached twice.
- Uploads stage in a dedicated private R2 bucket; its public domains stay disabled.
  Sending a comment copies the validated WebP into a separate public comment
  bucket using an R2 server-side copy, and persists that direct public URL.
  The private copy is discarded after the database commit; cleanup retries it.
  Unattached uploads never enter the public bucket. Credentials are scoped only
  to these two dedicated comment buckets, never the manga bucket.
- Published images load directly from R2 with plain image elements. Normal image
  views invoke no Vercel image route, optimizer or database query. The legacy
  `/api/comments/media/[id]` route only redirects; it never downloads image bytes.
  Authorized legacy private previews use short signed R2 links generated in the
  existing listing response, rather than a file proxy.
- Public image metadata is `no-store, max-age=0`. Domain cache rules must honor
  this metadata so deleted objects do not survive in a shared image cache.
  The configured `r2.dev` URL matches the site's current public R2 delivery, but
  Cloudflare documents it as rate-limited development delivery. A custom domain
  is the supported production path; no zone is currently available in this account.
- Deletion attempts exact tracked keys in both comment buckets immediately and
  removes asset metadata only after storage succeeds. A storage failure returns
  an error with the tracked key preserved for an explicit retry; it does not claim
  success. There is no seven-day retention of newly deleted images. Expired
  unused uploads and orphaned files remain eligible for scheduled cleanup.
- Public direct URLs are deliberately public: hiding a manga/page does not revoke
  a previously issued image URL. Deleting the comment removes the R2 object;
  copies a viewer already downloaded cannot be withdrawn.
- Cleanup and deletion lock the comment before its asset. Failed publication
  rolls back SQL and compensates by removing only an unlinked public copy,
  leaving the private staged upload available for retry.

## Database and activation

`db/migrations/0013_guest_comments.sql` adds six private tables and comment author,
status and idempotency fields. It preserves existing rows. It revokes direct
browser-role access to comments/votes and all private comment tables; application
reads and writes go through server-side Drizzle and authorized API routes.

The approved migration was applied to `magga-db` in this work session. Its schema
is already present there; do not apply the same SQL again blindly. This
application used Supabase migration tracking; reconcile that with Drizzle's
migration tracking before a future full historical migration run.

The private staging bucket `magga-comments`, public bucket `magga-comments-public`,
and the managed widget `Magga guest comments` exist, with
production domain `magga.vercel.app` and test domain `localhost`. Private bucket
public access was checked disabled, with no custom domains.

Before production code activation, configure the following in the deployment's
secret/environment store and build with the public site key present:

| Variable | Purpose |
| --- | --- |
| `R2_COMMENT_BUCKET_NAME` | Dedicated private staging bucket |
| `R2_COMMENT_PUBLIC_BUCKET_NAME` | Separate public comment bucket |
| `R2_COMMENT_PUBLIC_URL` | Canonical HTTPS public origin for the comment bucket |
| `R2_COMMENT_ACCESS_KEY_ID`, `R2_COMMENT_SECRET_ACCESS_KEY` | Object credentials scoped to both comment buckets |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public widget site key, needed at build time |
| `TURNSTILE_SECRET_KEY` | Server-only verification secret |
| `COMMENT_ABUSE_SECRET` | Optional separate HMAC secret; falls back to `BETTER_AUTH_SECRET` |
| `GUEST_COMMENTS_ENABLED` | Set `false` to pause guest comments |
| `GUEST_COMMENT_UPLOADS_ENABLED` | Set `false` to pause guest uploads independently |
| `CRON_SECRET` | Exact bearer secret for the cleanup endpoint |

The existing R2 account ID, database and auth configuration are also required.
Runtime credentials prepared for this session are in the ignored local secret
file `.vercel/.env.guest-comments.production.local`; no credential value belongs
in this document or Git. These new values have not yet been uploaded to Vercel.
Publishing the code to Git does not complete this environment configuration;
verify it and run a deployment smoke test before claiming the live feature works.

`vercel.json` schedules `/api/cron/comment-cleanup` daily at 00:15 UTC (07:15 Bangkok).
Hobby scheduling is approximate within the scheduled hour, not an exact-time guarantee.
The endpoint requires the bearer secret, never a query parameter. It operates
only on tracked eligible assets, expired counters and expired credentials.
The existing general cleanup endpoint was not invoked during fixture cleanup.

Admin manga deletion, both single and bulk, removes the selected thread/report
records in a transaction and immediately deletes only their tracked comment images.
Account deletion preserves other authors' replies: the deleted account's comments
become anonymous deleted placeholders owned by a banned tombstone with no login
session. Its tracked comment images are removed immediately, its private report references
are removed, and only its own contribution to vote scores is subtracted. These
destructive paths check the current admin role and Origin, not cached privileges.

## Earlier verification on 7 October 2026 (before direct R2 delivery)

| Verification | Result |
| --- | --- |
| Focused guest and integration tests | 114 passing tests across sixteen files |
| ESLint and TypeScript | Passed |
| Production build | Passed with the real configured database/runtime environment |
| Real database + HTTP checks | Seventeen guest/member/moderation flows passed; admin follow-up passed |
| Production server HTTP checks | Six passed, including optimizer rejection and irreversible restore guards |
| Deletion compatibility on real database/API | Four additional flows passed: bounded multipart, account deletion, single manga deletion, bulk manga deletion |
| Real Turnstile first guest | User manually completed the challenge; first Thai/emoji comment succeeded |
| Browser UI | File chooser/preview/upload/post, lightbox, edit, refresh ownership, delete confirmation, report and admin dismissal passed |
| Reply continuation | Loaded through reply 23 with owner controls preserved |
| Responsive checks | No document overflow at 320, 390, 768, 1024, 1280, 1440, 1920 px after fixing reader sidebar width |
| Full repository suite | 289 passed, 55 skipped; four MCP suites fail because pre-existing migration `0008_mcp_access_and_drafts.sql` is absent |

Tests cover owner isolation, ban/role refresh, CSRF, Turnstile replay/hostname/action
rejection, durable quota contention, missing trusted IP, staged-upload contention,
asset reuse/rollback, animation/metadata, private visibility, soft deletion,
timestamp precision, hidden parent/manga, cleanup retries and malformed JSON.
Vercel's deployed edge-header behavior and the eventual public deployment still
need a deployment smoke test; they were simulated in focused tests locally.

All real fixtures were recorded in ignored manifests before deletion. After
the relevant checks passed, only those exact fixtures were removed in two rounds:

- Three manga, three guest identities, two temporary member/admin profiles.
- Forty comments, four private image objects/assets, two reports, thirteen
  moderation events and twenty-one scoped rate-counter rows.
- Corresponding temporary credentials were invalidated by removing their sessions.
- The final compatibility round used two further manga, two profiles, one guest
  and one non-login tombstone, three comments, one image object/asset, two reports,
  two moderation events and thirteen scoped rate rows. These were removed as well.

A separate Supabase re-read confirmed zero fixture/comment/guest/asset/report/
moderation/rate rows and zero votes. The original thirty-three manga retain the
same ID digest `611bafd90208b7414e57af8f80475b8f`; the original twenty-seven profiles
remain. No pre-existing site data was deleted.

One diagnostic accidentally displayed the disposable guest test cookie. Its
database credential has been removed; no real user's cookie or runtime secret
was displayed. This does not grant access after fixture cleanup.

## Direct R2 and immediate publication verification (2.23.0)

| Verification | Result |
| --- | --- |
| Final focused regression checks | 84 tests passed across eight files, including upload/deletion races, storage failures, owner/admin/account/manga deletion, and redirect-only compatibility |
| ESLint, TypeScript and production build | Passed |
| Real database, HTTP and R2 | Twelve publication/upload/authorization/deletion/cleanup checks passed |
| Real deletion compatibility | Member deletion, single manga deletion and bulk manga deletion passed; four image keys disappeared from both buckets and public URLs returned 404 |
| Browser on production-mode localhost | Guest upload/post published immediately; image decoded at 800×500 directly from R2; zero `/api/comments/media/` requests; permanent owner deletion passed |
| Admin UI and responsive reader | No hide/publish/restore controls; no document overflow at 390 and 1280 px |
| Full repository suite | 327 passed, 55 skipped; the same four MCP suites fail because `0008_mcp_access_and_drafts.sql` is absent |

Both direct-R2 fixture manifests were cleaned only after their checks passed.
Only exact recorded IDs and eight object keys in the two dedicated comment
buckets were removed. Re-reading the database restored the original baseline:
33 manga with unchanged ID digest `611bafd90208b7414e57af8f80475b8f`, 27 profiles,
and zero comments. Temporary guest/member/admin sessions were invalidated by
their exact fixture cleanup. No pre-existing manga or profile was deleted.

Dependency audit is separate from these functional checks: `npm audit` reports
17 existing findings (6 moderate, 9 high, 2 critical), including runtime Next.js,
proxy-addr, Sharp and MCP SDK dependencies. The added matching
`@aws-sdk/s3-request-presigner` has no audit finding. `npm outdated --json` also
reports existing available updates; they were not bundled into this scoped
change. Passing these checks does not mean the entire dependency tree is free
of known vulnerabilities. Production activation still requires the environment
configuration and deployment smoke test described above.
