# Admin UI audit — 27 October 2026

## Scope and method

Desktop administration is the primary workflow; mobile remains supported. Inspected all 12 admin route patterns and both metadata tabs (13 screens), at 390, 1280 and 1920 CSS pixels: 39 browser checks against a local production build and disposable synthetic database. All returned HTTP 200; no uncaught page errors were observed. Non-GET/HEAD browser requests were blocked. No production data was changed.

This audit covers table allocation, visible defaults, overflow, dialog focus, loading geometry and basic accessible names. It is not a complete accessibility, security or production performance audit. Timing and layout-shift measurements are local observations, not field INP/CLS guarantees.

Screens: overview; manga list/create/edit; authors; users; comments; submission list/detail; advertisements; metadata categories/tags; MCP drafts.

## Baseline findings (subsequently corrected locally)

| Priority | Screen | Evidence | Proposed correction |
| --- | --- | --- | --- |
| High | Comments | At 1920px all six columns measure about 253px, including the checkbox and actions. The status select displays a blank default at all three tested widths. | Bound checkbox/status/actions, give comment text the remaining space, and display “ทั้งหมด” explicitly. |
| High | Submission list | At 1920px cover, title, sender, status, date and actions each receive about 253px. | Bound cover/status/date/actions; allocate remaining space to title and sender. |
| High | Submission detail | Document overflow is 94px at 390px and 145px at 1280px, with the synthetic long sender name/email; no overflow at 1920px. | Inspect sender flex rows and text wrapping, apply min-width: 0 and safe wrapping, and allow action rows to wrap. Verify both view and edit modes. |
| Medium | Manga create/edit | Recorded layout shifts at all three widths: approximately 0.037 at 390px, 0.024 at 1280px and 0.017 at 1920px. | Match loading and rendered form layout, including information/image order, column proportions and save area; remeasure after changing the skeleton. |
| Medium | Advertisements | At 1920px the action column takes about 331px. Two visible desktop icon buttons have no accessible name. | Bound the action column, let the name column expand and name edit/delete controls. Check the active switch too. |

The shared cause for the comments/submission tables is in `app/dashboard/DashboardThemeProvider.tsx`: `.admin-work-table` uses fixed table layout while header widths are forced to `auto !important`. Those screens have no column group, so their intended header widths cannot allocate space. Manga/authors/users now specify column groups; avoid removing the global rule without checking every consumer and the mobile card layout.

## Baseline code-confirmed risks

- **Loading geometry:** metadata still shows a chip-style loading layout while the final screen has lists. Comments and submission-list loading structures do not match current controls and row counts. Manga `FormSkeleton` still uses the old information/media arrangement. These mismatches are confirmed in code; their individual contribution to every observed shift has not been isolated.
- **Metadata tabs:** inactive labels use the muted text token and selected labels use the base gold token. Check foreground/background contrast for each tab state before changing shared theme colors.
- **Submission edit mode:** the optional category select uses an empty value without an explicit empty display. The initial view does not show this field; its visible edit state still needs verification.
- **Advertisement empty/loading states:** dim empty-state copy and loading row counts deserve review. The populated-screen test does not prove those states are correct.
- **Dialog/menu focus:** continue opening and cancelling dialogs from middle/lower rows. Do not classify intentional scrolling to validation errors or a confirmation area as a bug solely because the code calls a scroll API.

## Previously approved fixes in this working tree

- Manga: explicit desktop column allocation, stable bulk toolbar, readable extra-tag chips, visible filter defaults, matching list skeleton, and a row menu whose focus does not scroll the page.
- Authors: primary add action moved into the list header, more space for social links, bounded actions, wrapping/label limits, tolerant parsing of legacy link data, matching loading structure, and removal of the edit action's explicit scroll-to-top.
- Users: bounded role/stat/date/action columns, more room for identity/email, a single compact page-summary group, clearer controls and labels, matching loading structure, and prevention of automatic scrolling when focusing the suspension reason.
- Overview: top-three cards no longer stretch to match the neighbouring rank list.

Author/user layout checks cover 320, 390, 768, 1024, 1440 and 1920px (12 cases), without document overflow or uncaught page errors. Editor/role/suspension/delete flows are tested by opening and cancelling; account mutations are not exercised against production.

The final author editor open/close and suspension dialog open checks preserve scroll position (0px delta); a separate middle-row suspension open/close check also preserves position. A rapid automated click during the role menu's closing animation caused Playwright to scroll the trigger into view. Waiting for the popover root to detach eliminates that result, so it is not classified as a confirmed application focus regression. Final focused tests: 3 pass, 0 fail; lint and production build (including TypeScript) pass. The earlier full suite passed 558 tests before the final dialog focus/label adjustments.

## Delivery order and resource budget

1. Correct comments/submission table allocation, empty filter values and submission-detail overflow.
2. Match remaining loading layouts, then remeasure shifts.
3. Correct advertisement action sizing/names and verify shared tab contrast.
4. Repeat desktop and mobile checks, keyboard focus and dialog cancellation for affected screens.

Use existing MUI components and design tokens. These corrections need no new library, polling, analytics storage or database work, and do not add ongoing server workload. Preserve desktop information density and useful text widths while retaining mobile information-first forms.

## Implemented follow-up — 2.28.3

All findings in this report are addressed in the working tree:

- Comments and submissions use explicit column groups. At 1920px, comments allocate 52px to selection, about 590px to content, 156px to status and 144px to actions; submissions allocate 80px to covers and about 675px to titles. Desktop tables allow internal scrolling when the available workspace is narrower than 900px; mobile retains the stacked card layout.
- Comments display the empty status as “ทั้งหมด”; the submission editor displays the optional category as “ไม่ระบุ” and labels its select.
- Submission sender rows wrap long text and allow shrinking; action rows wrap. The previous 94px/145px document overflow no longer occurs at 390px/1280px, including edit mode.
- Comments and submissions now use their existing manager layout in a disabled loading mode, with skeleton rows matching the requested page size (comments) or 10-row page size (submissions). Loading mode suppresses fetches and URL writes. Metadata reuses the actual header, list controls, tabs and two-column rows, rather than obsolete chips.
- Manga form loading now matches the desktop image-left/information-right 8:4 arrangement and mobile information-first order. The asynchronous options notice has a reserved 28px region, preventing the entire grid from moving when options finish loading.
- Advertisement actions occupy 164px at desktop widths, with the name using remaining space. Both mobile and desktop edit/delete controls and active switches have accessible names. Empty-state text uses the readable secondary token; loading uses the same filter arrangement and desktop columns, with placeholders for the 20-row page limit.
- Shared admin tabs use secondary text at full opacity and hover-gold for selection. Submission tabs also use full opacity and scroll horizontally inside their toolbar on small screens.
- Metadata creation focuses its named input with `preventScroll`; opening and cancelling preserves page position.

Verification: all 39 route/viewport checks returned HTTP 200, with no document overflow, blank selects, unnamed visible icon buttons or uncaught page errors. The repeated local measurements recorded no layout shifts, including manga create/edit. An additional 15 checks cover submission editing/empty category, metadata dialog focus/cancellation, advertisement switch names, ad editing and empty search results at all three widths; no writes or uncaught errors occurred. The full suite passed 558 tests (1,757 assertions), lint and production build including TypeScript passed. These local results do not guarantee production field performance or complete accessibility conformance.

Nine extra checks cover comments, submissions and manga creation at 320, 1024 and 1440px: no document overflow or recorded layout shifts. At 1024px the two tables scroll inside their containers rather than widening the document; at 1280px their complete column sets fit the workspace.

No dependency, polling, database query or schema was added by this UI follow-up. Changes remain local and unpushed. The separate manga history feature still needs its explicitly reviewed production migration before history collection becomes available.
