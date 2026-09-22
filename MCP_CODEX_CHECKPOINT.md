# Codex local connection and research draft — 2026-09-08

Version: 2.3.2. Isolated worktree `magga-mcp`, branch `codex/mcp-phase-one`.

## Client configuration

Registered `magga-local` in the user's global Codex `config.toml` with URL `http://127.0.0.1:3100/api/mcp`, startup timeout 30 seconds and tool timeout 30 seconds. Existing entries were preserved. The `http_headers_helper` command uses the absolute Node executable and `scripts/mcp-codex-headers.cjs` path. It reads the ignored local writer credential file relative to the script, not the caller's working directory. No token was embedded in config or command arguments.

The helper rejects missing, malformed or expired credentials with a generic error and empty stdout. Its successful stdout is a secret authentication header intended only for Codex: do not run it directly in a shared terminal or log its output. Local keys expire seven days after issuance; renew the local writer key through the existing key administration workflow and securely update the ignored credential file. Server-side revocation and scope checks still apply.

Verified with the installed Codex binary's actual `app-server` protocol: initialize followed by `mcpServerStatus/list` discovered `magga-metadata` and all 12 expected tools, including draft creation/review/apply/reject. This verification did not start a model turn or create a task. The running app still reports 2.3.1 because this patch only adds client helper/workflow files; the next build will report 2.3.2.

An already-running desktop task may retain its previous tool inventory. Restart Codex to load the new server into the desktop session. This session's SDK call below is not claimed as a call through the desktop's newly loaded tool inventory. The official configuration guide describes Save then Restart: https://learn.chatgpt.com/docs/extend/mcp?surface=cli . Cloud clients cannot access this machine's loopback endpoint.

## Research and pending proposal

Inspected only public text on https://www.patreon.com/cw/hemuchang . The creator name is Hemuchang and the page lists the public post title “Smoke Break Full Comic”, matching the sampled author and manga. No locked content was accessed. This supports a proposed attribution; the server intentionally retains `verification: unverified` and client-origin confidence 0.9.

Using the official MCP SDK over the same authenticated HTTP endpoint, created and reviewed:

- Draft: `1cf426a9-e331-44e7-8581-97c34b0aebaf`
- Kind: `author_links`
- Author: Hemuchang (`e7881983-1b05-4cd1-af01-1b4ad74c267b`)
- Proposed profile URL: `https://www.patreon.com/cw/hemuchang`
- Current profile URL remains null; social links remain empty.
- Status: pending. No apply call was issued for this research draft.

The user can review this concrete proposal before authorizing apply in the local database. Obtain a fresh `get_metadata_draft` review token before applying with `confirm: true`. Nothing in this session modifies production data or merges/deploys the branch.

## Evidence

Ignored local reports: `.local/mcp/codex-connection-report.json` and `.local/mcp/research-draft-report.json`. Both services were verified listening only on `127.0.0.1` (ports 3100 and 55432). Helper tests cover valid output and missing/malformed/expired credentials without printing secrets. See the local database checkpoint for restart commands and earlier complete server-flow validation.

Final checks: `npm test` passed 114 tests across 14 files; `npm run lint` passed with the same three existing navigation warnings; `npx tsc --noEmit` and `git diff --check` passed. No framework or application runtime changed in this patch, so the previously successful configured production build was not repeated.
