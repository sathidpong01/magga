# Read-only administrator draft inspection — 2026-09-09

Version 2.4.0, isolated branch `codex/mcp-phase-one` in `magga-mcp`.

## User-visible result

Added **ข้อเสนอ MCP** to the administrator sidebar and `/dashboard/admin/mcp-drafts`. The user requested a way to independently inspect persisted proposals after confirming the hosted draft through Supabase SQL. This implements the agreed first step: a read-only page, with no approval/rejection controls.

The page includes status filters, 20-row pagination, target names, proposer/client names, a selectable draft, current versus proposed fields, safely linked sources, client-supplied confidence, current author social links and persisted creation/latest-status timestamps. Manga metadata references include human-readable names alongside their IDs. Missing targets, empty lists and database errors have explicit states. Refresh uses `router.refresh()` to fetch current values rather than revisit a cached link.

The comparison explicitly describes current values as live values at page load, not historical before-images. The existing schema has no complete before/after snapshot or draft ID on every audit event, so the page does not fabricate a per-draft audit trail. History displays only creation/update times, persisted state, reviewer and note when available. No unrelated client audit events are attributed to the selected draft.

## Access and database behavior

- Server-rendered, force-dynamic route; session fetched through Better Auth with cookie cache bypassed.
- Missing/non-admin/banned sessions redirect to sign-in. The data reader independently checks the current profile's admin role and both ban flags in the database before querying drafts.
- Administrator inspection covers all MCP drafts, including drafts belonging to revoked/expired keys, using explicit non-secret columns. No MCP bearer token, secret hash, key prefix or review token is sent to the browser.
- All draft queries run in a repeatable-read, read-only transaction. They do not use the MCP review service's row-locking decision path. There are no mutations, schema migrations or production catalog changes in this feature.
- Public-looking HTTPS links are validated before rendering as links; other strings are escaped plain text. Sources remain labeled as unverified by the system.
- Registered administrators can inspect proposals; the ordinary website login is sufficient. Codex configuration/keys are not needed to view the page.

## Validation and evidence

- `npm test`: 120 tests passed across 15 files. New tests cover filter bounds, refusing draft reads when the database role check fails, empty state and read-only transaction options.
- `npx tsc --noEmit`: passed. `npm run lint`: zero errors, the same three existing navigation warnings.
- Configured production build passed, including the new dynamic route.
- Browser verification with Playwright on the guarded local PGlite environment: signed-in synthetic administrator, selected author draft, current X/proposed Patreon, source/confidence, refresh and responsive 1440px/390px layouts. No client errors observed. Existing age/cookie dialogs were dismissed through their controls; no DevTools-protection code was changed.
- Local non-admin browser was redirected to sign-in and did not render draft comparison. An initial HTTP-status-only assertion was inadequate because the loading boundary can stream a redirect in a 200 response; the browser navigation/absence-of-data check passed.
- Local fixture changes: created `mcp-ui-check-20260909@example.com` only in PGlite, temporarily toggled its role for authorization tests, restored admin role; reset the sample Hemuchang URLs to match the production comparison and inserted local draft `a132be67-6251-4840-8f43-8a8fe884ca2a`. These are test fixtures, not production changes. Earlier sample-isolation counts from the initial database checkpoint are historical and no longer apply after this UI test account.
- Independently ran the exact administrator data reader against main Supabase using the authorized operator connection in read-only mode. It returned draft `ad3c9620-185c-4f29-a452-38b062bd672b`, pending, Hemuchang, current X URL, proposed Patreon, proposer Nightsu9/client Codex hosted preview. Private evidence is `.local/mcp-production-backup/admin-read-report.json`.
- Screenshots are local-only `.local/mcp-drafts-desktop.png` and `.local/mcp-drafts-mobile.png`. Browser artifacts are explicitly ignored by Git and Vercel.
- `next dev` generated its managed instructions in AGENTS.md. The generated block was verified against the installed generator and preserved with the changes.

## Preview

Deployment: `dpl_7NfZD2tbGRoBtB7nB2Z7NCikJTux`, target preview, URL https://magga-nhmit8wdu-zayhiii.vercel.app . It uses the already-authorized main Supabase connection and deployment-specific MCP flags. No production alias or environment was changed, and main was not merged.

Vercel status Ready confirmed. Unauthenticated hosted request returned the streamed sign-in redirect, private/no-cache/no-store headers and no proposed Patreon URL in the response body. Authenticated UI rendering was verified locally; the identical data reader was separately verified against main Supabase, without borrowing a production browser session.

Direct draft link:
https://magga-nhmit8wdu-zayhiii.vercel.app/dashboard/admin/mcp-drafts?draft=ad3c9620-185c-4f29-a452-38b062bd672b

The old preview URL is an immutable older deployment and does not contain the new page. The existing `magga-preview` MCP connection may continue using it, since both deployments read the same database. Use the new URL above for the administrator UI. Approval/rejection remains a later feature at this checkpoint; the pending Hemuchang draft was not applied or rejected in this session.

Follow-up: version 2.5.0 implements browser decisions in a newer preview. See `MCP_ADMIN_DECISIONS_CHECKPOINT.md` for its URL, local browser evidence and the unchanged pending production draft.
