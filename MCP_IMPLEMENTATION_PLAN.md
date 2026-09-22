# Magga MCP implementation plan

Updated 2026-09-08: client-driven research. Supersedes the research-provider assumptions in earlier phase checkpoints.

## Architecture

User -> Codex / another AI client -> client search/browser -> public sources.
The client calls Magga POST /api/mcp with a bearer key to read catalog data, validate proposals, create drafts, review and apply explicitly authorized changes.

Magga does not run a search provider, crawler, browser, page fetcher or AI model. No research subscription/API credential/provider decision is required. research_public_author_links is removed from the planned server tool set. The legacy research:read scope remains database-compatible but grants no capability; the new key CLI does not issue it.

## Isolation and runtime

- Worktree ../magga-mcp, branch codex/mcp-phase-one, version 2.3.1.
- No main merge, live key issuance, real migration or deployment.
- Endpoint disabled unless MCP_ENABLED=true.
- Stateless Streamable HTTP on Next.js Node runtime, buffered JSON, maxDuration 30 seconds.
- Shared limit 60 HTTP requests/minute/key; body limit 16 KiB and five-second body-read timeout.
- Bearer keys belong to existing active administrators. Browser cookies are not accepted.

## Tool permissions

catalog:read:
- find_manga, get_manga_details, find_author, get_author_details
- list_categories_and_tags, get_tagging_context, validate_tag_proposal
- list_metadata_drafts, get_metadata_draft

catalog:read + draft:write:
- create_metadata_draft

catalog:read + metadata:write:
- apply_metadata_draft, reject_metadata_draft

Scopes are independent. Discovery and execution enforce the same boundaries. Drafts are visible only to keys belonging to the same administrator owner as the requesting key. Hidden/nonexistent manga remain unavailable.

## User flow

1. User asks the AI client to research or update metadata.
2. Client reads the catalog, researches public work-relevant sources, validates exact tag names.
3. Client creates a pending draft with a fresh UUID request_id. Identical retries reuse it.
4. Client calls get_metadata_draft and presents current values, proposed values, sources and effect to the user.
5. When the user explicitly authorizes applying/rejecting that proposal, client sends confirm:true and the returned review_token to the relevant tool.
6. Server rechecks live key/owner/scopes, locks draft/target, recomputes the review hash and rejects stale reviews. Refresh and review again before retrying stale proposals.
7. Metadata changes, terminal draft status and success audit commit together. Cache invalidation follows; cache failure is reported separately and retried on completed apply retries.

Confirmation and review hashes are protocol/concurrency safeguards, not proof of human consent. The client must obey actual user authorization; the server trusts the bearer key's write authority. Decisions move pending directly to applied/rejected atomically. The reserved approved status is not accepted by this flow.

## Draft contracts and effects

- manga_tags: {tag_names:string[]}, exact existing tags. Apply is additive/idempotent; existing tags remain.
- manga_metadata: nonempty subset of {title,category_id,author_id}. Only supplied fields change. Slug/pages/description/visibility remain intact. Database uniqueness and reference constraints still apply.
- author_links: {profile_url?,social_links?:string[]}. Set proposed profile URL and merge unique social URLs into existing JSON link objects, preserving old labels/icons. Invalid legacy link data must be corrected separately before this tool can review/apply it.

No delete, publish, SQL, impersonation, tag-replacement or direct author-creation tools are included. Any future replace_manga_tags needs an explicit current-tag precondition.

## Public references

Sources contain public URLs and client-supplied confidence. Server stores verification:unverified and confidenceOrigin:client. It never claims to have visited sources or verified accounts. The user/client evaluates source quality outside Magga.

URL storage accepts public-looking HTTPS DNS hostnames without credentials, query, fragment or nondefault ports. IP literals/local hostname forms are rejected. Optional MCP_PUBLIC_SOURCE_HOSTS limits new references to exact comma-separated hosts. Unset accepts syntactically valid hosts; explicitly empty denies all URLs. No provider/domain selection is required by default.

Storage validation performs no DNS lookup or HTTP request and MUST NOT be reused as fetch authorization. A future fetching feature would need separate SSRF, DNS/redirect, size and timeout controls. Clients must not submit private contacts, secrets or unrelated personal data. Structural validation cannot determine the truth/privacy of every title or URL path.

## Keys and data

Trusted local database operator: npm run mcp:keys -- --help.
- issue: choose existing administrator, client label, explicit scopes and expiry within one year; token appears once in the successful response. Store it securely.
- list: IDs, prefixes, scopes and dates only; never token/hash.
- revoke: owner-scoped and idempotent; referenced keys are retained.

Key management is not exposed over MCP. Clients cannot mint/escalate keys.
Tables: mcp_api_keys, mcp_metadata_drafts, mcp_audit_events, migration 0008.
RLS/no browser privileges; append-only audit trigger. Database administrators can still change schema, so this is not tamper-proof storage. Audits omit raw proposals/sources/queries/exceptions/tokens. Retention remains manual; no purge job is introduced.

## Remaining integration work

2026-09-10 social details follow-up: version 2.7.0 preserves researched social account labels/icons via object entries, supports reviewed updates to details of exact existing URLs, and retains legacy URL-only clients. See `MCP_SOCIAL_LABELS_CHECKPOINT.md` for the pending Meesh repair, preview, validation and browser verification limitation.

2026-09-09 new-author follow-up: version 2.6.0 supports `manga_author` proposals, creating a new author with social channels and assigning one previously unassigned manga atomically upon approval. This supersedes the earlier exclusion of author creation through reviewed drafts; direct author-creation tools remain excluded. Migration 0009 and a pending Meesh/Little Buddy 1 draft are documented in `MCP_NEW_AUTHOR_CHECKPOINT.md`.

2026-09-09 follow-up: version 2.5.0 adds authenticated administrator review/apply/reject controls with fresh snapshot confirmation, shared transactional decisions and browser audit attribution. Local browser apply/reject and hosted authorization checks passed; the real Hemuchang draft remains pending. See `MCP_ADMIN_DECISIONS_CHECKPOINT.md` for the new preview and verification boundary. This supersedes the read-only-only boundary below; main merge/production promotion remain separate.

2026-09-09 update: the user requested a read-only browser inspection page after verifying the persisted draft via SQL. Version 2.4.0 adds `/dashboard/admin/mcp-drafts` with authenticated current/proposed comparison, sources and persisted lifecycle timestamps. This supersedes the earlier assumption that no web UI was needed. See `MCP_ADMIN_DRAFTS_CHECKPOINT.md`; browser approval/rejection remains outside this step.

2026-09-08 hosted update: the user selected main Supabase after backup. Logical backup and application restore rehearsal passed before migration 0008 was applied. Vercel preview and Codex app-server discovery now pass against that database with a catalog/draft-only key. See `MCP_HOSTED_PREVIEW_CHECKPOINT.md` for the endpoint, evidence, backup scope and remaining production release boundary. The historical local-only notes below describe the preceding checkpoint.

Update: local reference-database setup, a configured full build and an official SDK HTTP smoke flow are now complete; see `MCP_LOCAL_DATABASE_CHECKPOINT.md`. Codex configuration and actual app-server tool discovery are also verified; a sourced author-link draft is pending review (`MCP_CODEX_CHECKPOINT.md`). The local environment uses persistent PGlite, not a hosted/native PostgreSQL replica. Refreshing the desktop tool inventory, other client connections and hosted preview checks remain.

1. Completed locally: disposable database using the existing schema and reviewed migration. Historical baseline files are incomplete; do not assume db:migrate can bootstrap a new database alone.
2. Completed locally: test administrator keys and isolated Codex endpoint, without copying production credentials.
3. Codex discovery and research -> pending draft are verified. Apply the research draft only after concrete user approval. Claude Code/Antigravity verification is optional when those clients are selected.
4. Verify host/proxy behavior, cache invalidation, runtime limits and a full configured build before preview/deployment.
5. Merge/deploy only when separately requested. A web admin UI is unnecessary for this workflow.
