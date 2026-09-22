# Administrator draft decisions — 2026-09-09

Version 2.5.0 on `codex/mcp-phase-one`, in the separate magga-mcp worktree. Adds administrator approval/rejection to the previously read-only draft page. No merge to main, production promotion, migration or production draft decision was performed.

## Behavior

- Pending drafts expose review/apply and reject buttons. Each opens a fresh server comparison with sources and requires an explicit confirmation checkbox.
- Browser requests use the signed-in administrator, with uncached session lookup and a database role/ban recheck. This does not grant metadata:write to the existing catalog/draft-only Codex key.
- GET/POST `/api/admin/mcp-drafts/[id]` return no-store responses. POST requires same-origin JSON, a strict bounded body, a review token and confirm:true. It never trusts a client-supplied user ID.
- Browser and MCP decisions share the existing transactional target validation, snapshot digest, row locking, idempotency and atomic draft/target/audit updates. Stale comparisons fail and require a new review. Cache invalidation runs after commit; an invalidation failure is reported separately from a successful database write.
- Browser audit tool names are admin_apply_metadata_draft/admin_reject_metadata_draft. ownerUserId/reviewerUserId identify the acting administrator; keyId attributes the draft's originating key, not browser authentication. An administrator may review another administrator's draft even when its originating key was revoked.
- Existing audit schema does not store a complete historical before-image. No schema change is included.

## Verification

- 136 tests passed in 16 files, including browser authorization, bounded/strict requests, stale snapshots, bans/role changes and shared MCP regressions.
- Type checking and production build passed. Lint: zero errors and three existing navigation warnings. Local build warns about missing local Google OAuth credentials; Google login was not tested.
- Actual signed-in Playwright browser exercised apply and reject against guarded PGlite at 127.0.0.1:55432. Confirmation remained disabled until checked. The resulting draft states, author URL, reviewer and exactly one audit per decision were independently read from local SQL.
- Local fixtures: apply de5820c6-0b62-48ef-8a44-dedc6eb641ab; reject 6991f554-c3a2-4dfb-b088-e1f25b26ab29; synthetic account mcp-ui-decision-20260909@example.com. These are disposable local records only.
- Browser testing caught a legitimate same-origin POST being rejected when Next normalized the request URL from 127.0.0.1 to localhost. The check now uses the actual Host header with the request protocol, never X-Forwarded-Host. Regression tests cover both normalization and forged forwarded-host rejection; browser decisions passed after the fix. Initial diagnostic 403s are not counted as successful tests.
- Local evidence (ignored by Git/Vercel): `.local/mcp/browser-decisions-report.json` and `.local/mcp-decision-modal.png`.

## Hosted preview and remaining boundary

Ready deployment: dpl_5R3obHPm6hyWKTntgNgTTjWg4zie, target preview.

https://magga-lrzkcz52z-zayhiii.vercel.app/dashboard/admin/mcp-drafts?draft=ad3c9620-185c-4f29-a452-38b062bd672b

Uses the previously authorized main Supabase connection. This is a code-only deployment; the historical backup documented in MCP_HOSTED_PREVIEW_CHECKPOINT.md is not a fresh snapshot made during this session.

Hosted unauthenticated GET, foreign-origin POST and same-origin POST without a session all returned 403 with no-store. The same-origin request reached the authentication check. Authenticated hosted writes were deliberately not executed; full browser decisions were verified locally.

After deployment, a read-only magga-preview get_metadata_draft call independently confirmed the real draft ad3c9620-185c-4f29-a452-38b062bd672b is still pending, current profile https://x.com/Hemuchang, proposal https://www.patreon.com/cw/hemuchang. Sources remain client-supplied/unverified. The administrator can now inspect and explicitly choose a decision in the preview UI; doing so writes to main Supabase.

The existing Codex MCP connection can remain on its older deployment because it accesses the same database. The new browser controls require the new preview URL. Main merge and production promotion remain separate work requiring user authorization.
