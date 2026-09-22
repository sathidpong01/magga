# Social account labels and icons, 2026-09-09 to 2026-09-10

Version 2.7.0, separate codex/mcp-phase-one worktree. Fixes the reported loss of social account labels/icons when MCP created Meesh. No main merge, production promotion or schema migration.

## Behavior

- Both author_links and manga_author accept social_links entries as legacy URL strings or strict objects `{url,label,icon}`. Labels are nonempty, trimmed and bounded to 200 characters. URLs/icons are bounded to 2048 characters.
- Objects preserve the researched account label and favicon. For an exact existing URL, an object updates only its label/icon; other channels and other stored fields remain. A URL-only entry never overwrites existing details. New URL-only entries fall back to the last URL path segment and a Google favicon URL, rather than hostname plus the unusable literal `link`.
- Approval repeats URL/icon validation. Icon references may include query parameters (favicons commonly need these), while retaining public-host HTTPS checks and refusing credentials, local/IP hosts, data/javascript schemes and fragments. Account/source URL rules remain stricter. Icon CDN hosts are independent of the account/source host allowlist. No new server-side fetch behavior was introduced.
- Existing social_links review output remains a URL array. The additive social_link_details projection contains only url/label/icon; arbitrary legacy extra fields stay private but are preserved during merge. Review digests already cover raw stored links, so concurrent label/icon edits invalidate stale reviews.
- Shared page/dialog summaries display labels, icons and URLs, with old/new details and separate additions/metadata-update counts. Research remains the client's job; the tool description asks clients to supply researched objects. The fallback is not a verified display name.

## Meesh repair proposal

Main author 5f787904-5fea-422b-bf5b-68f9570ec978 exists following the user's approval of the earlier new-author draft. The repair proposes updates to its three existing URLs only, with no primary-link field:

- Bluesky: `🔞 Meesh 🔞`, favicon https://web-cdn.bsky.app/static/favicon-32x32.png
- Patreon: `Meesh`, favicon https://c5.patreon.com/external/favicon/rebrand/favicon.svg?v=af5597c2ef
- Fur Affinity: `Meesh`, favicon fallback https://www.google.com/s2/favicons?domain=www.furaffinity.net&sz=128

Bluesky's public profile and the existing /api/metadata reader supplied the account title/icon. Patreon metadata returned "Meesh — Creating Erotic furry comics"; the account name was retained without its descriptive tagline. Fur Affinity could not be fetched directly; its account name is supported by the previous profile research and artist's Linktree, and the icon is explicitly a fallback. Source confidence remains client-supplied/unverified on the server.

Hosted draft 6ea2cbe5-14f8-4cd4-b7bc-c80f647b732c was created via the SDK with the existing draft-only key and re-read. On 2026-09-10 it remains pending; existing channel URLs remain unchanged. This work has not applied the repair to the live author.

https://magga-dzwm36cor-zayhiii.vercel.app/dashboard/admin/mcp-drafts?draft=6ea2cbe5-14f8-4cd4-b7bc-c80f647b732c

Ready preview dpl_9dh1jseb7mW9wTTwz3ox7shxm2QD, reverified 2026-09-10. Codex magga-preview configuration now points to its /api/mcp endpoint without scope/credential changes. Running clients may retain older tool descriptions until reconnecting.

## Validation and limits

- 146 tests across 17 files passed. Added integration coverage for persistence of researched details on new authors, updating exact existing URLs without removing other channels or their legacy fields, URL-only preservation, stale label edits, unsafe icons and malformed detail objects.
- TypeScript, local production build and hosted preview build passed. Lint had no errors and the same three existing navigation warnings. Local build still warns about missing test Google OAuth credentials.
- A local metadata-repair fixture was created (012378dc-3522-47a5-b7a2-79632e25b4e7); the revised icon rendering has not received a fresh authenticated browser screenshot check in this step. Database mutation behavior is covered by the integration suite. Do not conflate the prior version's browser new-author approval check with this revision.
- Research/request/report files remain under ignored .local paths. No secrets were printed. Existing database backup is historical; no new backup/migration was necessary for this code and pending-proposal change.
