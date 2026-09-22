# Category creation and manga assignment, 2026-09-10

Version 2.9.0 on `codex/mcp-phase-one` in the separate `magga-mcp` worktree. This completes the category side of the reviewed metadata workflow. It is not merged into `main` and has not been promoted to production.

## Existing and added behavior

- Existing categories could already be assigned through `manga_metadata.category_id`, but MCP could not propose a category by name or create a missing category.
- `validate_category_proposal` now reports the manga's current category, a case-insensitive existing category match, or the proposed new category name. It performs no writes.
- A category-only `manga_metadata` draft accepts either `{category_id}` or `{category_name}`. The two fields are mutually exclusive. Category-only proposals need no external source; proposals that also change title or author retain the source requirement.
- Creating a draft remains proposal-only. It never creates a category or changes the manga.
- Approval takes a short write lock on the category catalog, rechecks the review digest, reuses a matching category case-insensitively or creates the missing category, then assigns it to the manga. Category creation, manga assignment, draft state and audit event share one transaction.
- A manga has one category. The administrator page and confirmation dialog therefore show the current-to-proposed category and state clearly whether approval reuses an existing category, creates a new category, changes the current category, or makes no effective change.
- If another writer creates the proposed category after review, the review becomes stale and must be refreshed. Rejection, audit failure and stale review leave both the category catalog and manga unchanged. Completed apply retries are idempotent.
- Existing scopes remain unchanged. The preview key can validate and create pending drafts, but cannot apply them.

## Database and Supabase

No table, column, policy, grant or draft-kind constraint changed. The existing `categories` table, `manga.category_id` relation and `manga_metadata` draft kind already support the operation. No migration or production backup was needed, and this phase ran no DDL or metadata writes against Supabase main.

## Validation

- Focused MCP draft/review/protocol suite: 64 tests passed.
- Full Vitest suite: 154 tests across 17 files passed.
- Added coverage for existing/new classification, source-free category-only drafts, invalid mixed category references, case-insensitive reuse, atomic creation and assignment, idempotent retry, stale catalog detection and rollback on audit failure.
- ESLint completed with zero errors and the same three existing internal-navigation warnings outside this change.
- Next.js 16.3.4 production build and TypeScript passed against the preserved loopback test fixture. Existing local Google OAuth warnings remain.

## Preview and Codex

Ready preview: `https://magga-c2ujfik1c-zayhiii.vercel.app`

Deployment ID: `dpl_EFiV9NqQXubp8obXTL96zh321T26`

The deployment uses only deployment-specific `MCP_ENABLED=true` and `MCP_LOCAL_DATABASE=false`. Project-level preview variables and production variables were not changed.

The official MCP SDK verified that `MM` resolves to the existing production category and a unique probe is classified as new. Missing credentials return 401, the draft-only key cannot discover apply, and the check performed no writes or draft creation. Private evidence is stored in the ignored `category-preview-report.json`.

Codex `magga-preview` points to this deployment with the existing credential helper and scopes. A fresh Codex app-server process discovered eleven permitted tools, including `validate_category_proposal`, and reported server version 2.9.0. An already-open task may retain its earlier MCP tool snapshot until reconnecting.
