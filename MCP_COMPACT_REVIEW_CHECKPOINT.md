# Compact draft review, 2026-09-09

Version 2.5.1, separate codex/mcp-phase-one worktree.

- Author review now shows primary-link replacement separately from additive social links. One shared summary renders both the page and fresh approval dialog: new URLs, existing URLs kept, and counts. Exact duplicate URLs are omitted from additions using the writer's URL serialization; alternate URLs for the same account are not automatically treated as equivalent.
- Rejection dialog only explains that existing data stays unchanged and asks for confirmation. Approval button labels describe adding channels, changing the primary link, or both. Existing fresh review token, explicit confirmation and server authorization remain.
- Removed repeated introductions and list IDs/proposer metadata. Sources/confidence and lifecycle/IDs remain available in collapsed details. Completed drafts are explicitly compared against current data, not historical before-images.
- MCP create-draft tool guidance now tells clients to use social_links for additions, reserve profile_url for an explicitly requested primary-link change, and inspect existing channels first. This is client guidance, not a new server-enforced intent constraint. Existing client connections on older deployments require the new endpoint to receive this description.
- No catalog or draft mutations, migrations, main merge or production promotion in this turn.

Validation: TypeScript passed; 136 tests in 16 files passed; lint zero errors with the same three existing navigation warnings. Vercel preview build Ready: dpl_CdiTt4B5VHT387AheKPDbdu5wR1e.

https://magga-osevno43t-zayhiii.vercel.app/dashboard/admin/mcp-drafts?status=all

Signed-in local Playwright page rendering and screenshot inspected against existing PGlite fixtures. The compact link list and collapsed secondary details rendered correctly. Local dev HMR websocket errors/reloads prevented confirming the revised modal visually during this pass; no browser decision was submitted. Shared decision regression tests passed, but this is not a fresh end-to-end write verification. Local screenshot `.local/compact-reject.png` captures the page (despite its filename), not an open modal.

The preview retains the previously authorized main Supabase connection: confirming a pending draft there still writes actual data. User reported rejecting the previous Hemuchang proposal; this turn did not recreate it.
