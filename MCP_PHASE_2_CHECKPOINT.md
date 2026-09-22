# Phase 2 checkpoint — 2026-09-08

Version: 2.2.0. Continues in `magga-mcp`, branch `codex/mcp-phase-one`.
Main remains untouched. No merge, push, preview deployment, real database connection or real migration was performed.

## Delivered: validation and pending drafts

- `validate_tag_proposal(manga_id, tag_names)` requires `catalog:read`, checks an existing visible manga, deduplicates names and reports exact existing tags plus unknown names. It makes no writes and does not silently substitute similar tags.
- `create_metadata_draft(request_id, kind, target, proposal, sources)` requires both `catalog:read` and `draft:write`. `metadata:write` does not imply either permission. Discovery and execution enforce scopes independently.
- Three strict proposal contracts:
  - `manga_tags`: `{tag_names: string[]}`; all names must exist. This is a proposal only, with no implicit add/replace operation.
  - `manga_metadata`: one or more of `{title, category_id, author_id}`; referenced category/author must exist. Arbitrary description/extra-metadata fields are deliberately not supported in this checkpoint.
  - `author_links`: `{profile_url?, social_links?: string[]}` with at least one link.
- All proposals persist with `pending` status. Client-supplied status, reviewer, SQL or extra proposal properties are rejected. No approval, application or metadata update tool exists.
- Creation locks the current key/owner and target rows in a transaction, rechecks live admin/ban/revocation/expiry/scopes, validates catalog references, inserts the draft and inserts its success audit in that same transaction. Audit failure rolls back the draft.
- A client-generated UUID `request_id` serves as the draft ID. Reuse it with identical normalized input after an uncertain response. The same key/input returns the same pending draft; changed payload, changed sources, another key, or a no-longer-pending draft fails. UUID collisions never overwrite an existing draft.
- HTTP invocation audits remain separate from the atomic persistence audit. A committed draft can survive a subsequent HTTP/audit-delivery failure; retry with the same `request_id`. Audits omit source URLs, proposal bodies and secrets.

## Sources and research boundary

- `sources` entries accept only `{url, confidence}`. The server stores `verification: unverified` and `confidenceOrigin: client`; a high client confidence does not mean server verification.
- Source and proposed social/profile URLs must use HTTPS and exact hostnames configured in server-only `MCP_PUBLIC_SOURCE_HOSTS` (comma-separated). Empty configuration allows no links. No domains were configured on this machine.
- Rejects credentials, query strings, fragments, nondefault ports, IP literals, local suffixes and unlisted hosts/subdomains. Non-tag drafts require at least one source; tag drafts can have an empty source list.
- This is validation for stored references only. There is no fetch, DNS lookup, crawler, search provider or social-account verification. The URL helper is explicitly unsuitable for authorizing future outbound network requests; future fetching still needs DNS pinning, private-network checks, redirect validation, size limits and timeouts.
- Automated `research_public_author_links` remains unavailable until provider, API credentials, allowed domains, cost limit and retention policy are selected. This checkpoint completes the validation/draft delivery step, not all research work in Phase 2.

## Usage examples

Validate tags using an existing manga UUID and exact catalog names:

```json
{"manga_id":"<existing manga UUID>","tag_names":["<existing tag name>"]}
```

Create a pending tag draft (no source-domain configuration required):

```json
{
  "request_id": "<new UUID, reuse for identical retries>",
  "kind": "manga_tags",
  "target": {"type":"manga","id":"<existing visible manga UUID>"},
  "proposal": {"tag_names":["<existing tag name>"]},
  "sources": []
}
```

There is still no UI or MCP tool for reviewing/listing/applying drafts. Operator review remains a subsequent delivery step. No additional migration was needed; the existing Phase 1 draft table is used.

## Validation and readiness

- `npm test`: 84 passed in 11 files (23 additional tests since Phase 1).
- `npx tsc --noEmit`: passed after narrowing the draft test factory type.
- Lint: no errors; the same three pre-existing internal-navigation warnings remain.
- In-memory PostgreSQL tests verify exact tags, hidden/nonexistent targets, idempotent retries, conflicts, source status, independent scopes, stored revocation/scope changes, audit rollback, and unchanged manga/author/tag data.
- MCP protocol tests verify scope-dependent discovery, request identity propagation and rejection of injected approval properties.
- No dependency changes beyond the synchronized project version bump. Phase 1 audit/outdated results were not refreshed in this phase.
- Preview readiness remains unverified. The Phase 1 full build stopped at an existing route requiring PostgreSQL configuration. It was not repeated with the same missing environment; no real credentials were copied. An isolated configured database and real client connections remain required.

Next implementation step: draft review/key management and the approved write policy; research integration remains gated by the provider/domain/retention decisions above.
