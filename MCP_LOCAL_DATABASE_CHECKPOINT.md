# Persistent local reference database — 2026-09-08

Version 2.3.1, branch `codex/mcp-phase-one`, worktree `magga-mcp`.

## Result

A persistent local PGlite database now serves the real Next.js app through the PostgreSQL wire protocol on `127.0.0.1:55432`. The built app is running on `http://127.0.0.1:3100`, with MCP at `/api/mcp`. Both listeners bind exclusively to loopback. No cloud project/branch was created.

The database files are under `.local/mcp/db`; they survive process shutdown. This is PostgreSQL compiled to WASM, with a socket multiplexer. It is suitable for functional development, not a substitute for native PostgreSQL concurrency/load testing or hosted Supabase Auth/Storage/Data API testing. See [PGlite socket documentation](https://pglite.dev/docs/pglite-socket).

## Production reference reads

Source: the active `magga-db` Supabase project, verified live through the connector. Every source query used `BEGIN READ ONLY` and a local 8-second statement timeout. No source DDL, migration, insert, update or delete was issued; no production database credentials were copied into the worktree.

- Read metadata for 22 public tables: columns/types/defaults/generated expressions, primary/unique/check/foreign-key constraints, 30 additional indexes and seven updated-at triggers.
- Reviewed the shared update trigger function before recreating its behavior locally.
- Read only these five catalog projections: visible manga `{id,title,slug,author_id,category_id}`, authors/categories/tags `{id,name}`, manga_tags `{manga_id,tag_id}`.
- Sampled five visible manga, three linked authors, one linked category, 11 tags and 16 manga-tag relationships. Extra existing tags allow additive-tag tests.
- Did not read/copy account, password, profile, session, token, email, contact, comment, rating, view or submission rows. Public table names/estimates were inspected as metadata only.
- Did not copy media/page URLs, descriptions, arbitrary metadata or author social-link text. Manga use a local SVG cover and empty pages; other non-copied fields use defaults/nulls.
- Final production verification still reported 22 public tables and zero MCP tables. MCP tables were created only locally.

## Local creation and isolation

1. Captured schema/reference and catalog JSON under ignored `.local/mcp/`.
2. `scripts/mcp-local-bootstrap.ts` recreated columns/constraints/indexes and the reviewed updated-at behavior using a direct local PGlite instance. It never creates a network client or reads `DATABASE_URL`; it cannot target production.
3. Enabled local RLS and revoked public/anon/authenticated privileges for reference tables. Production user-session policies/private functions were not copied. Server-side application queries use the local backend role. This deliberately does not claim parity with the hosted browser Data API.
4. Applied the existing MCP migration 0008 locally, adding the three MCP tables and audit protection.
5. Seeded only the approved public projections and created the synthetic owner `mcp-local-admin`. It has no email, password, account or session and is only an MCP key owner.
6. Issued one read-only key and one read/draft/write key, both local-only and expiring seven days after creation. Tokens were saved in ignored `.local/mcp/client-credentials.json` without printing them.
7. Created ignored `.env.local` with the loopback database URL, local app URL, generated local Better Auth secret and local placeholder storage settings. Google OAuth remains unconfigured; the build prints warnings but succeeds.
8. Added a runtime guard: `MCP_LOCAL_DATABASE=true` accepts only `127.0.0.1:55432/postgres` and limits each application pool to one connection. A mistakenly supplied remote URL fails instead of connecting.
9. Started the database and built Next.js app as hidden local processes. PID files/logs are in `.local/mcp/`. No merge, push or cloud deployment occurred.

## Validation performed

- `npm run build`: passed, including TypeScript and generation of 47 static pages. The previous missing-connection build failure is resolved in this isolated environment.
- `npm test`: 108 passed across 13 files, including destination-guard tests that reject remote/wrong-port/wrong-database URLs before any client opens.
- `npx tsc --noEmit`: passed.
- `npm run lint`: no errors; three pre-existing internal-navigation warnings remain.
- `npm run mcp:smoke`: passed using the official MCP SDK client over actual HTTP to the built Next.js route, through postgres.js/TCP into the persistent local database.
- Verified one synthetic profile, zero accounts/sessions, five manga, three authors and 11 tags.
- Missing bearer returned 401. Reader discovered nine tools; writer discovered 12. Reader could not apply a draft.
- Created a pending tag draft without changing manga_tags, reviewed it, applied exactly one additional catalog tag, verified all previous tags remained, retried apply without duplication, and checked successful audit events.
- The smoke test leaves its applied draft/audit and added tag in the local database intentionally. There are now 17 manga-tag relationships after the first successful smoke run; production data was not changed.
- Homepage returned HTTP 200 and rendered the local placeholder cover.
- Confirmed both listeners bind `127.0.0.1`, not all network interfaces.
- `npm outdated --json`: same seven unrelated packages remain outdated. Added pinned dev dependency `@electric-sql/pglite-socket` 0.2.11.
- `npm audit`: four moderate development dependency findings remain in Drizzle Kit's esbuild chain; no high/critical findings. No force downgrade was applied.

Artifacts: `.local/mcp/bootstrap-report.json`, `.local/mcp/smoke-report.json`, database files, credential file and process logs are local-only and excluded from Git. The source/reference snapshots and tokens are not committed.

## Reuse

The app and database are currently running. Local preview: `http://127.0.0.1:3100`; MCP endpoint: `http://127.0.0.1:3100/api/mcp`.

For a later restart, run in separate terminals from this worktree:

```powershell
npm run mcp:db
npm run start -- --hostname 127.0.0.1 --port 3100
```

Use Ctrl+C in those terminals to stop services. The current hidden service process IDs are recorded in `.local/mcp/database.pid` (tsx launcher) and `.local/mcp/web.pid` (Next.js); the database TCP listener runs as the launcher's child process. Do not stop unrelated Node.js processes.

```powershell
npm run mcp:smoke
```

The smoke test adds a currently unused tag to a sample manga on every run. It is designed for this disposable local sample, not production, and hardcodes both local endpoints. It fails once there are no unused sample tags. Tokens are loaded from the ignored credential file and never passed as CLI arguments or printed.

`npm run mcp:bootstrap` refuses to overwrite an existing database or `.env.local`. It is not a reset command. Reconstruction requires the reviewed local reference/sample files; obtain fresh snapshots with the same read-only projections if those files are absent. Preserve/move existing local state before deliberately creating a new test environment.

Follow-up: Codex is now configured and its app-server discovered all 12 tools using the local credential helper; see `MCP_CODEX_CHECKPOINT.md`. Restart the desktop client to refresh an existing task's tool inventory. Claude/Antigravity configuration has not been changed. An external/cloud client cannot reach this machine's loopback URL. Hosted preview/native PostgreSQL parity remains a separate verification step.
