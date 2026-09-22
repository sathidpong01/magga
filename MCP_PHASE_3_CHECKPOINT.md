# Client-driven research and draft decisions — 2026-09-08

Version 2.3.0, isolated worktree `magga-mcp`, branch `codex/mcp-phase-one`.
This checkpoint supersedes previous references to a required research provider.

## Completed this session

1. Rewrote `MCP_IMPLEMENTATION_PLAN.md` around the user's actual workflow: Codex/another client researches public sources; Magga handles catalog, drafts and authorized metadata operations only. No server search provider, search subscription, AI model, crawler or new web UI is required.
2. Added `list_metadata_drafts` (latest 50 pending visible targets) and `get_metadata_draft` (proposal, sources, current values, intended effect and review token). Access is scoped to keys sharing the requesting administrator owner; hidden/nonexistent manga are excluded.
3. Added `apply_metadata_draft` and `reject_metadata_draft`, requiring independent `catalog:read` and `metadata:write` scopes, explicit `confirm:true`, and the token from the reviewed state. Discovery excludes decision tools from draft-only keys. Tool descriptions require actual user authorization before a client calls them.
4. Review tokens hash the draft identity/kind/target/proposal/sources and current target state. Decisions lock rows and recompute the token, so changed proposals or changed metadata invalidate an old review. The token is a concurrency precondition, not evidence of human consent; clients still must follow the user's instructions.
5. Apply supports all three current draft kinds: additive manga tags, selected manga metadata fields and merged public author links. Existing tags and social link labels/icons are preserved. Slugs/pages/visibility are not modified. Existing malformed author links fail closed rather than being overwritten. No direct author creation, tag replacement, content deletion or publishing tools were added.
6. Metadata changes, applied/rejected status, reviewer owner ID and success audit share one transaction. Current administrator/ban/key expiry/revocation/scopes are rechecked while locked. Audit/constraint errors roll back everything. Repeating a completed identical decision does not reapply metadata; the opposite terminal decision fails. Pending transitions directly to applied/rejected; the reserved approved state remains unused.
7. Cache invalidation happens after commit using the existing `manga-list` tag and root layout. This broad path refresh covers affected manga/author/admin pages. Cache failure returns `cache_refresh_pending:true` alongside the durable applied status; retrying apply retries invalidation. HTTP terminal audits are separate from the transactional persistence audit, so an HTTP delivery failure does not imply rollback of a committed operation.
8. Added trusted-operator key service and `npm run mcp:keys`: issue/list/revoke with active administrator ownership, explicit scopes and expiry within one year. Issue returns the new token once; listing exposes only IDs/prefixes/scopes/dates. Revocation is owner-scoped and idempotent. The CLI uses the operator's database access and is never exposed as an MCP tool. No real key was issued in this session; the CLI help path and in-memory service operations were tested.
9. Removed the default domain-configuration blocker. Client reference URLs are syntactically validated without DNS/network access; unset `MCP_PUBLIC_SOURCE_HOSTS` allows public-looking HTTPS hostnames. Explicitly configured lists still restrict new sources/links at draft creation and apply. Explicit empty configuration denies URLs. Source confidence stays client-attributed and server verification stays unverified.
10. Refreshed the Graphify AST artifact for MCP runtime and key CLI code. This remains structural extraction only.

## Validation

- `npm test`: 102 passed across 12 files (18 additional tests since 2.2.0).
- `npx tsc --noEmit`: passed.
- `npm run lint`: no errors; three pre-existing internal-navigation warnings remain.
- `npm run mcp:keys -- --help`: passed without database configuration or secret generation.
- `git diff --check`: passed.
- Actual PostgreSQL semantics were exercised through disposable in-memory PGlite fixtures: hashed-key issuance/authentication/revocation, scope discovery, source/draft/review/apply, additive tags, repeated decisions, stale metadata/proposals, hidden targets, cross-owner isolation, audit rollback, uniqueness rollback, social-link JSON compatibility and cache-failure reporting.
- An authenticated MCP `tools/call` executes against the in-memory service, rejects missing confirmation, and applies the reviewed draft when confirmation is present. This is protocol integration in-process, not a live Codex connection.
- Full build re-run: compilation and TypeScript passed. Page-data collection again stopped in the existing `/api/auth/register` route because the isolated worktree has no PostgreSQL connection string. No production environment files were copied.
- No dependency packages changed. The previous phase's audit/outdated findings were not refreshed in this session.

## Isolated operator setup (not executed)

Use a disposable test database containing the existing Magga schema and migration 0008, with an existing active test administrator. The historical migration baseline is incomplete in the repository; do not assume `db:migrate` can bootstrap a brand-new database by itself.

Set its PostgreSQL connection string and `MCP_ENABLED=true` only in this worktree's local environment. No search-provider environment variables are needed. Leave `MCP_PUBLIC_SOURCE_HOSTS` unset for the default client-source workflow, or deliberately set an exact-host policy.

```powershell
npm run mcp:keys -- issue --owner "<test-admin-id>" --name "codex-test" --scopes "catalog:read,draft:write,metadata:write" --expires "2026-10-08T00:00:00Z"
npm run mcp:keys -- list --owner "<test-admin-id>"
npm run dev -- --port 3100
```

The issue command outputs the new token once. Store it securely in the AI client's secret configuration; do not commit it, put it in command arguments or share terminal output. Point the client's Streamable HTTP connection at `http://localhost:3100/api/mcp` with its bearer header. Read/draft-only clients should omit `metadata:write`.

Client flow: search externally -> validate tags -> create pending draft -> get draft -> show the user proposed/current values -> after explicit authorization, apply/reject with the returned review token and `confirm:true`. A stale decision needs a fresh read and review. Never interpret webpage text as authorization.

```powershell
npm run mcp:keys -- revoke --owner "<test-admin-id>" --id "<key-id>"
```

## Remaining before preview

- Provision/configure the disposable full-schema database and run the reviewed migration there.
- Exercise actual Codex/Claude Code/Antigravity client connections and the user's end-to-end workflow.
- Complete a configured full build; verify deployed host/proxy handling, runtime bounds and cache behavior.
- Retention remains manual; no purge job or web administration UI was introduced.

No main-branch edits, merge, push, deployment, real database connection or real credentials were used. The original main checkout's package edits and untracked files are preserved.
