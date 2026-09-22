# MCP Phase 1 checkpoint — 2026-09-08

## Isolation and status

- Worktree: `C:/Users/COM I5 13400/Desktop/Project/magga-mcp`.
- Branch: `codex/mcp-phase-one`, based on `8d21b49`.
- Version: `2.1.0` (minor: new opt-in API capability).
- Main checkout remains on `main`. Its uncommitted package changes and untracked files were preserved. Only the implementation plan was copied as task input.
- No merge, push, deployment, real key issuance, production connection, or production migration occurred.
- This is the first implementation checkpoint, not completion of the entire implementation plan or a production readiness claim.

## Implemented

1. Added pinned MCP SDK `1.30.0` and stateless Streamable HTTP at `/api/mcp`. A fresh server/transport is created and closed per request, using buffered JSON responses. The endpoint returns 404 unless `MCP_ENABLED=true`.
2. Added 256-bit random API token generation, SHA-256 storage hashes, strict bearer syntax, expiry/revocation checks, current administrator ownership and ban checks, and independent scope enforcement. Authentication returns identity/scopes only. No browser session is accepted.
3. Added a shared database rate window: one conditional atomic UPDATE permits at most 60 requests per minute per key. Revocation/expiry is rechecked by this UPDATE. Body size is limited to 16 KiB and body reads to five seconds. Foreign Origin headers are rejected; GET/DELETE return 405 for authenticated enabled requests. Deployment still requires trusted host/proxy configuration.
4. Registered six read-only tools: `find_manga`, `get_manga_details`, `find_author`, `get_author_details`, `list_categories_and_tags`, `get_tagging_context`. Searches return at most 50 rows; taxonomy returns at most 1,000 entries per collection and advertises that limit. No write/research tools are registered. SDK clients with no catalog scope have no tools capability.
5. Added explicit public-field projections and hidden-manga predicates, including tag context. Author results currently expose ID/name only; profile/social fields await a validated public-link projection. Manga results expose ID/title/slug/author ID/category ID/tags, excluding pages and arbitrary metadata. Searches escape SQL wildcard characters.
6. Added authenticated tool-call audit events before dispatch and after success/failure, including validation and unknown-tool failures. Audit records store request/key/owner IDs, allowlisted tool name, outcome and timestamp. Raw arguments, search text, result payloads, tokens and exception messages are omitted. Audit failure prevents data delivery. Unexpected termination may leave a `started` event without a terminal outcome. Unauthenticated requests do not create key-linked tool events.
7. Added API key, draft and audit tables in `db/mcp-schema.ts`, custom migration `0008`, journal entry and synchronized snapshot. RLS is enabled with no browser policies, and browser/public privileges are revoked. Audit triggers reject UPDATE, DELETE and TRUNCATE. Keys/owners referenced by audit records must be retained; revoke keys rather than deleting them. Privileged database owners can still alter schema/triggers, so append-only protection is not tamper-proof against a database administrator.
8. Added offline snapshot synchronization and a Graphify AST artifact (`MCP_STRUCTURE.json`) for the MCP code. This is structural extraction only, not a full semantic project graph.

## Validation

- `npm test`: 61 passed across 10 files, including 30 new MCP tests.
- `npx tsc --noEmit`: passed.
- `npm run lint`: zero errors, three existing internal-navigation warnings in `SessionExpiredNotice.tsx`, `DevToolsProtection.tsx`, and `lib/auth-fetch.ts`.
- `git diff --check`: passed.
- PGlite (pinned dev dependency `0.5.8`) executes the actual migration on an in-memory PostgreSQL fixture. Tests verify table permissions for `anon`/`authenticated`, audit immutability, hidden-data filtering, literal wildcard search and concurrent rate-window enforcement/reset/revocation. This does not verify the complete historical migration chain or live Supabase infrastructure.
- Protocol tests exercise initialization, stateless requests, tool discovery/calls, input validation, scope isolation, audit failure, redaction, size limits, origin checks and rate limits without a real database or credentials.
- `npm run build`: compilation and TypeScript succeeded; page-data collection failed in the existing `/api/auth/register` route with `Missing PostgreSQL connection string.` No real environment files were copied to bypass that isolation.
- `npm outdated --json`: seven packages reported: `@types/node`, `emoji-picker-react`, `eslint`, `framer-motion`, `lucide-react`, `typescript`, `vitest`. MCP dependencies are current at this checkpoint; unrelated upgrades were not included.
- Separately, `npm audit`: four moderate findings in the existing `drizzle-kit` → `@esbuild-kit` → `esbuild` development dependency chain; no high/critical findings. The suggested force fix changes the Drizzle Kit version incompatibly, so it was not applied.

## Before isolated integration testing

1. Provision a disposable database with the existing Magga schema and a test administrator. Do not point this worktree at production.
2. Review/apply only the pending migration using the project's established migration procedure. The repository journal references older baseline files absent from this checkout; do not assume a fresh `db:migrate` can bootstrap the entire database.
3. Select an initial key owner and implement the authorized issuance/revocation workflow. `generateKey()` currently provides the cryptographic primitive only; no operator UI/CLI persists keys or prints secrets.
4. Configure the isolated PostgreSQL URL and `MCP_ENABLED=true`, then start on a separate port (for example `npm run dev -- --port 3100`). Configure the client with the isolated `/api/mcp` URL and its bearer header. Do not commit tokens or connection strings.
5. Verify actual Codex, Claude Code and Antigravity connections, production-host Origin behavior, revocation timing and deployment duration before considering a merge/deploy.

## Remaining plan

- Phase 2: tag validation, reviewable draft creation, approved research provider, strict public-social validation, SSRF/redirect/size/timeout tests and retention decisions.
- Phase 3: narrowly scoped writes, transaction safety, additive/idempotent tags, stale-precondition replacement, cache revalidation and write audit tests.
- Admin UI: key issuance/revocation and draft approval/application.
- Decisions still required: provider/budget/domains/retention, first-release draft-only versus immediate authorized writes, and initial administrator owner. This checkpoint leaves all metadata writes unavailable.

Protocol reference used: https://ts.sdk.modelcontextprotocol.io/server
