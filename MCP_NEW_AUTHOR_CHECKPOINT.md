# New author + manga assignment, 2026-09-09

Version 2.6.0, codex/mcp-phase-one, separate magga-mcp worktree. User requested a new-author draft for Meesh and Little Buddy 1. Main merge and production promotion were not performed.

## Contract and implementation

`create_metadata_draft` now accepts kind `manga_author`, a manga target and proposal `{name, social_links}`. It requires a visible manga with no author, at least one public HTTPS social URL and a source. Name is trimmed, bounded and excludes control/markup characters. A primary URL is intentionally not part of this operation. Existing tool scopes are unchanged: draft-only clients can propose, but cannot apply.

Approval revalidates the stored proposal and current manga in the existing locked transaction. It refuses to replace an assigned author. A brief authors SHARE ROW EXCLUSIVE lock (5-second lock timeout) serializes the case-insensitive, outer-whitespace-insensitive name absence check against other writers. The new author, manga assignment, draft decision and audit either all commit or all roll back. Ordinary author reads are not blocked. This guards the creation operation; it is not a global case-insensitive uniqueness policy for other legacy author writers, nor identity matching across aliases. Same-action retries do not create another author. Rejection creates no author and changes no manga.

Page and fresh approval dialog share a compact new-author summary: name, three channels and the manga being assigned. Explicit checkbox confirmation and existing stale-token/auth safeguards remain. Browser administrator identity supplies reviewer/audit actor. Sources remain stored as client-supplied/unverified.

## Migration and backup

Migration 0009 only expands the draft kind check constraint. No catalog columns, policies or grants changed. Registered in the repository migration journal; the hosted database has no drizzle.__drizzle_migrations ledger, so only this reviewed SQL was applied in a bounded transaction, following the existing operator workflow. Do not run all historical migrations against this established database blindly.

Fresh main Supabase backup before migration: `.local/mcp-production-backup/before-new-author-20260909.dump`, 478303 bytes, SHA256 `ade7a11207f5c8453e9c1d86209f6ef67fd3e57528a8a103f86c3f3a55db7cf3`, 815 TOC entries. Archive listing and hash verified; no fresh full restore rehearsal was run. Credentials were never printed; directory is excluded from Git/Vercel. Destination verified as ssgsxrdobafxkiuigoqw/postgres before migration. Counts before/after migration: 11 authors, 28 manga, 1 existing draft. No catalog writes occurred.

## Verification

- 143 tests across 17 files passed. Seven new integration tests exercise proposal-only behavior, scope denial, atomic creation/assignment, retry idempotency, rejection, normalized duplicate names, late assignment, audit rollback and invalid inputs.
- Lint: zero errors, three existing navigation warnings. Production build passed including type checking.
- Initial local build failed because the old persistent PGlite instance would not start (WASM abort). Its files were preserved. A fresh isolated fixture database was bootstrapped under `.local/new-author-test/db` using the existing schema/public reference sample, with migrations 0008/0009. No production accounts/media were copied. It serves 127.0.0.1:55432; the app's existing local-database guard and environment remain.
- Signed-in local browser opened the new summary, confirmed the button was disabled before checking, then approved the local test draft. Independent SQL verified one created Meesh author, three social channels, null primary URL, manga assignment, applied status and one administrator apply audit. Test draft dd2adc1d-63ce-4c3b-9f08-f923a3a37064; test manga 46dabe36-bf01-4eb2-8293-39aedde42045. Evidence `.local/new-author-test/ui-report.json`. Local Vercel analytics script 404s are unrelated to this flow; Google OAuth is not configured locally.
- Hosted SDK discovered manga_author on the new preview using the existing catalog/draft-only key, created a pending draft and re-read it. The key still cannot discover apply_metadata_draft. After creation, a separate read-only SQL check confirmed main Little Buddy 1 still has author_id NULL and no Meesh author exists.

## Reviewable result

Ready preview: https://magga-8c894qq0q-zayhiii.vercel.app , deployment dpl_3mNqY82Juh3No4k67CWd1bZd1ERC.

Draft: d4ba4e8e-b103-4317-98c1-c5ec1f026f58, pending.

https://magga-8c894qq0q-zayhiii.vercel.app/dashboard/admin/mcp-drafts?draft=d4ba4e8e-b103-4317-98c1-c5ec1f026f58

Manga: Little Buddy 1, fb97d251-05c2-446e-a4c9-d2458839983b. Proposed new name: Meesh. Social channels:
- https://bsky.app/profile/meeshy.bsky.social
- https://www.patreon.com/meesh
- https://www.furaffinity.net/user/meesh/

Evidence from research in the preceding turn: the artist's Little Buddy post https://www.newgrounds.com/art/view/meeshymeesh/little-buddy-modern-cover and linked accounts at https://linktr.ee/artofmeesh . Confidence 0.9 is the researching client's assessment, not server verification.

Codex magga-preview URL was updated to this deployment in the local config without changing credentials/scopes. An already-running client's cached tool schema may require reconnection. Main author creation/assignment remains pending the user's browser approval; this turn did not apply the hosted draft.
