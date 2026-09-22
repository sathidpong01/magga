# Hosted MCP preview — 2026-09-08

Version 2.3.3, branch `codex/mcp-phase-one`, sibling worktree `magga-mcp`.

## Authorization and scope

The user confirmed successful direct Codex read/review/apply in the local environment with screenshots, then requested the next step. When asked about a hosted database, the user explicitly selected the main Supabase database with a backup first. This session therefore prepared a backup, verified application restore, applied the additive MCP schema to that database and deployed a Vercel **preview**. It did not merge main, promote production, apply a catalog draft or migrate the local sample data into production.

## Backup before migration

- Source: `magga-db`, project `ssgsxrdobafxkiuigoqw`, PostgreSQL 17.6. Preflight found zero MCP tables.
- Downloaded official EDB PostgreSQL 17.11 Windows binaries into ignored `.local/pg-tools/`; no system PostgreSQL service was installed.
- Used native `pg_dump` custom format against the session pooler on port 5432, with credentials passed through the child environment and source read-only transaction defaults. No credentials appeared in command arguments or output.
- Archive: `.local/mcp-production-backup/before-mcp-20260908.dump`, 463444 bytes, 787 TOC entries.
- SHA-256: `88d86c7f9d1dc86bd6c67a84073526f9d6c3293c5d25e1544ebef57b32527272`.
- Backup/report directory is excluded from Git and Vercel uploads and restricted by Windows ACL to the current user and SYSTEM. It contains private production data: do not share it or serve it publicly.
- Restored `public` and `private` application objects and all 22 public tables into a new loopback native PostgreSQL instance on port 55433. Counts matched all 22 source tables at verification. Restored indexes, constraints, triggers and policies through `pg_restore --single-transaction --no-owner --no-privileges`.
- Restore prerequisites included local anon/authenticated/service_role roles, private schema and an `auth.uid()` null stub. This verifies application data/schema recovery, not full Supabase Auth/extension/role parity. Rehearsed migration 0008 successfully against that restored database. Stopped the restore-test PostgreSQL afterward; its restricted data directory remains available.
- This is a database logical backup, not a Storage/R2 object backup or complete platform/role-credential backup. Supabase documents that database backups exclude Storage objects: https://supabase.com/docs/guides/platform/backups . Original local PGlite remains separate.

Evidence: private `backup-report.json`, `archive-toc.txt`, `restore-report.json` in the same ignored backup directory.

## Main database changes

Applied the reviewed `db/migrations/0008_mcp_access_and_drafts.sql` through Supabase migration `mcp_access_and_drafts`. Added only the three MCP tables, index and append-only audit trigger/function. Verified RLS enabled and no SELECT/INSERT/UPDATE/DELETE privileges for anon/authenticated on all three tables.

Security advisor returned three informational `rls_enabled_no_policy` findings for these tables; this is intentional backend-only access, not a missing browser grant. No warning/error security findings were returned. Reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy .

Issued a seven-day preview key owned by the existing eligible administrator `Nightsu9`, with `catalog:read,draft:write` only. Key ID `c07924dd-1c6d-4640-a841-7ccc8cad6028`. The ignored credential file is `preview-credentials.json` under the restricted backup directory. This key cannot apply or reject metadata drafts. Verification made catalog reads and their MCP audit/rate-limit bookkeeping; no production catalog metadata was changed and no production research draft was created.

## Deployment and client

- Vercel project: `zayhiii/magga`; deployment `dpl_3AUKVL522C3DuW9gpba2AFbZebjT`, target preview, status Ready.
- URL: https://magga-nenhz379r-zayhiii.vercel.app
- MCP URL: https://magga-nenhz379r-zayhiii.vercel.app/api/mcp
- Used existing remote preview environment, with deployment-specific `MCP_ENABLED=true` and `MCP_LOCAL_DATABASE=false` at build/runtime. Local `.env.local` was preserved. Production environment variables and production alias were not changed.
- Added `.vercelignore` to explicitly exclude backups, local credentials, local builds and agent workspaces. The uploaded source was 7.7 MB; the PostgreSQL archive and database backups were excluded.
- Registered `magga-preview` in global Codex config with `scripts/mcp-preview-headers.cjs`, preserving `magga-local`. Header helper checks expected project, token format and expiry and never includes secrets in error messages.
- Installed Codex app-server initialized and discovered all 10 permitted tools from the hosted endpoint, reporting server version 2.3.3. The current task's tool snapshot is not claimed to have refreshed. Open a new task after the app loads the new MCP configuration; if necessary restart Codex. Hosted preview does not depend on either local service.

## Validation

- Fixed missing `Cache-Control: no-store` on early HTTP rejection and disabled/unavailable route responses. Added tests for noncacheable rejection and same-origin HTTPS requests.
- `npm test`: 117 passed, 14 files, including preview credential checks.
- `npm run lint`: zero errors, three pre-existing navigation warnings.
- Local configured production build passed; Vercel remote build/deployment also passed with 2.3.3 runtime. The helper/test/checkpoint additions made after deployment do not change the hosted application runtime.
- Real hosted HTTP: missing bearer 401 with no-store; foreign Origin 403; official SDK initialization/listTools/find_author succeeded against main Supabase. Ten tools discovered; apply/reject absent.
- Actual Codex app-server discovery independently succeeded. Private reports: `hosted-report.json` and `codex-connection-report.json`.

## Operational follow-up

Use `magga-preview.find_author` with query `Hemuchang` to verify a newly loaded Codex task. Research and pending drafts may be created on the main database using this key; applying requires a separately authorized writer key and explicit approval of a reviewed draft. The earlier local draft ID belongs to PGlite and is not available on this hosted database.

If preview access must stop, revoke the preview key or remove the preview deployment. Do not drop the MCP tables as a first response: drafts/audit may need preservation. Restoring a full database snapshot over live production could overwrite newer user data and is not an automatic rollback. Any later production merge/deployment remains a separate step.
