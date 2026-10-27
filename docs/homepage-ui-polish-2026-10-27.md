# Homepage UI corrections — 2.28.4

The homepage audit found inaccessible filter labels, blank unavailable categories, low-contrast text, small mobile filter fields, a narrow search input, incomplete loading geometry and a header menu that did not receive keyboard focus.

## Changes

- Header menu items are direct siblings rather than nested inside a generic wrapper. Identity information uses a non-interactive list subheader. Items unavailable at the current breakpoint are omitted from the open menu, so keyboard traversal does not stop on hidden entries.
- Opening the menu focuses its first visible enabled item with `preventScroll`. Arrow navigation, Home/End and Escape use the normal MUI menu behaviour. Closing restores the trigger without scrolling. Trigger/menu relationships are labelled.
- Category/sort controls reference their existing visible headings through MUI's `labelId`; search and tags have persistent accessible names. An unavailable category remains explicit, with guidance to choose another or clear filters, preserving the URL's actual meaning.
- Category/sort targets are 44px high. Search/tags input roots and associated popup controls have 44px minimum targets. Mobile search omits a redundant leading icon and hides the filter chevron while keeping the filter icon, state and count. The default placeholder is shorter.
- Search suggestion secondary text uses the readable secondary token. Active filter text uses hover-gold on its soft background.
- The home fallback includes the same CSS-controlled continue-reading slot when the corresponding page state allows it. Its existing pre-paint local-history flag reserves the same 72px plus 16px margin. Filtered states do not reserve an unrelated resume slot. Card skeleton stats now reserve the rendered row's 19.2px height.

## Validation

Used the current production build with a disposable synthetic database, accepting age/cookie state and blocking browser writes/external requests. No production data was changed.

- Six viewports: 320, 390, 768, 1024, 1280 and 1920px, using mobile/touch contexts for mobile sizes. Initial and expanded states have no document overflow or uncaught page errors; sampled startup layout-shift records are empty.
- Category/sort targets measure 44px. At 320px search text width increases from about 82px to 126px; at 390px from 152px to 196px.
- Guest mobile menus focus their sign-in item and close with Escape, without moving the page. Member and admin menus at 390/1920px pass ArrowDown, Home, End, Escape and trigger restoration; open/close scroll deltas are 0px.
- Unavailable category URLs display their unavailable value and recovery guidance rather than a blank select. Accessibility snapshots name all four filter inputs. Valid local resume entries fit with a 72px region and 16px margin, without recorded startup shifts.
- Full test suite: 558 pass, 0 fail, 1,757 assertions. Final lint, production build (including TypeScript), frozen install and diff checks pass.

Synthetic images cannot establish production image-loading/LCP performance. Sampled startup measurements do not guarantee every slow fallback or field INP result. First-visit age/cookie flow and account mutations were outside this correction's validation scope.

This change adds no dependency, polling, server endpoint, database query or schema. The existing DevTools heuristic is unchanged. Changes are local and unpushed; no deployment or production migration was performed.
