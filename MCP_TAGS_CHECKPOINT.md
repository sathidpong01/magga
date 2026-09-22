# Tag creation and manga assignment, 2026-09-10

Version 2.8.0 on `codex/mcp-phase-one` in the separate `magga-mcp` worktree. This phase adds tag creation and additive manga assignment to the existing reviewed-draft workflow. It is not merged into `main` and has not been promoted to production.

## Behavior

- A `manga_tags` proposal remains `{tag_names:string[]}` and remains pending until an administrator approves it. Draft creation never creates a tag or changes a manga.
- Validation and review classify requested names as existing catalog tags or new tags. Names are trimmed and deduplicated case-insensitively while preserving the first proposed spelling.
- Approval takes a short write lock on the tag catalog, rechecks the review digest, reuses matching tag names case-insensitively, creates only missing tags, and adds all requested relationships with conflict-safe inserts. Existing manga tags are never deleted.
- Tag creation, manga relationships, draft status and audit event share one transaction. Rejection writes no catalog data. Same-action retries do not create duplicates.
- The stale-review digest includes matching catalog tags. If another editor creates a proposed tag after review, approval stops as stale so the administrator can see that it will now reuse an existing tag instead of creating one.
- The administrator page and confirmation dialog show only the requested tags, with one of three outcomes: `เพิ่มจากแท็กที่มี`, `สร้างใหม่แล้วเพิ่ม`, or `มีอยู่ในเรื่องแล้ว`. The summary also reports how many existing manga tags remain.
- Tool scopes are unchanged. A draft-only MCP key can validate and propose; it cannot approve or write metadata.

## Database and Supabase

No schema, policy, grant or migration changed. The existing `tags` and `manga_tags` tables already support this operation, so no new production backup was required and no database DDL was run. The Supabase changelog was checked before implementation; the listed current database breaking changes do not affect this transaction-only change.

## Validation

- Focused draft/review integration suite: 43 tests passed.
- Full Vitest suite: 148 tests across 17 files passed.
- ESLint: zero errors; three existing internal-navigation warnings remain outside this change.
- Next.js 16.3.4 production build and TypeScript passed. The first prerender attempt could not reach the stopped local test database at `127.0.0.1:55432`; the preserved fallback PGlite fixture was started and the unchanged build then passed. Google OAuth test credentials remain intentionally absent locally and produce the existing warnings.
- New coverage proves proposal-only behavior, case-insensitive reuse, atomic creation plus assignment, preservation of assigned tags, idempotent retries, stale catalog detection, rejection and rollback behavior.

## Preview

Ready preview deployment: `https://magga-lblb76zgq-zayhiii.vercel.app`

Deployment ID: `dpl_mkhUR3oP9Dsf6hEWftbSEKhQkbwc`

The first Ready build, `dpl_8kbH9yWdMHRc6mhEq3dopSMNKChi`, intentionally returned 404 from `/api/mcp` because the direct deployment omitted its deployment-specific `MCP_ENABLED` flag. It was superseded by the deployment above with `MCP_ENABLED=true` and `MCP_LOCAL_DATABASE=false`; project-level preview variables and production variables were not changed.

The official MCP SDK reached the enabled preview using the existing draft-only key. Missing credentials returned 401. `validate_tag_proposal` classified production tag `Dog` as existing and a unique probe name as new, while reporting `valid: true`. The check performed no metadata writes and created no draft. The key still cannot discover `apply_metadata_draft`.

Codex `magga-preview` now points to this deployment without changing its credential helper, scopes or timeout. A fresh Codex app-server process discovered all ten permitted tools and server version 2.8.0. The current task may retain its original tool snapshot until reconnecting.
