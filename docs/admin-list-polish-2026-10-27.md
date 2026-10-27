# Admin list polish (2.28.1)

This follow-up implements the approved desktop-first admin table, menu, filter, contrast, loading-layout and interaction review. The public reader is unchanged. Earlier uncommitted view-history work remains included; its production migration has not been applied.

## Changes

- Utility columns retain fixed widths instead of being inflated by percentage columns. At a 1920px viewport, title/tags/action widths changed from approximately 399/177/249px to 325/543/160px. Checkbox, cover, category, status and views remain 52/80/100/96/120px. The title takes 22% of table width and tags receive the remainder. Long titles are limited to two lines with their full text available through the link title. Covers use 48×64px, retaining 3:4 geometry. Below the desktop breakpoint the existing labeled mobile rows remain; narrow desktop tables scroll inside their container and keep actions sticky.
- Row menus mount only when opened. Initial focus runs after Popover's synchronous positioning, uses `preventScroll`, and does not wait for animation. Explicit close restores focus without scrolling. Menus are constrained to the viewport and dismiss when their anchor moves through scrolling/resizing. Keyboard navigation and dialog actions are retained.
- Filter fields display the empty-valued default options (`ทั้งหมด`, `ล่าสุด`) using `displayEmpty` and a floated label. Unsupported values fall back to the displayed default, consistent with existing query behavior. Search remains submit-based; pending controls prevent repeat navigation. Other admin pages retain their existing outer control spacing.
- The additional-tag count uses shared readable colors instead of muted text on a dark chip. Empty-category text and unchecked checkbox colors were also corrected. No purple or new palette was introduced.
- Manga loading and content share the header, controls, column definitions and page spacing. Loading reserves the requested 20 or 50 rows and uses the same cover and view-chart dimensions. Bulk actions replace content within a reserved desktop toolbar rather than pushing the table down after selection.
- The initial sidebar placeholder now reserves its full desktop width including outer padding and cannot flex-shrink. The user-information region reserves height before the session arrives. Existing collapsed-state storage behavior is retained.

## Evidence

Local verification used production builds with synthetic data on the disposable database only. No production writes, deployment or new dependencies were introduced.

| Check | Before | After |
| --- | --- | --- |
| Open middle-row menu | scrollY 1108 → 1536, a 428px jump | 0px change at top/middle/bottom |
| Initial sort/status display | blank/blank | ล่าสุด/ทั้งหมด |
| Table movement after selecting a row | toolbar inserted above rows | 0px row displacement on desktop |
| Initial observed layout-shift sum, expanded sidebar | about 0.0274 | 0 in the final observed run |
| Tag / additional-count text contrast | additional-count color was insufficient | approximately 6.79 / 5.87 |

Browsers verified 390, 768, 1024, 1280, 1440 and 1920px viewports with no document-level horizontal overflow or uncaught page errors. Desktop tests opened all three menu positions within the viewport, verified focus restoration, and tested ArrowDown/Enter/Escape on a 50-row page. A mobile menu also opened without scrolling the document. Sorting persisted after reload and status returned to `ทั้งหมด` after browser Back. Sidebar collapse retained containment.

The original 246.8ms render shown in the screenshot was not reproduced exactly. Browser Event Timing is a different measurement from that overlay's render bar: the baseline interaction sample peaked around 80ms, and the final sample ranged approximately 16–80ms. Intermediate cold samples reached 104ms. These are local samples, not field INP measurements or a universal speedup claim. Lazy menu mounting reduces work for closed menus, but moves their first construction to the first open.

The zero-shift result applies to the measured expanded-sidebar initial load. A previously saved collapsed preference can still change geometry when local storage is read after hydration; this follow-up does not introduce server-visible preference cookies or claim zero shift for every persisted-state configuration. Arbitrarily long content and other dashboard routes also require their own measurements before claiming universal CLS compliance.

Final validation passed lint, TypeScript through the production build, 555 tests, frozen installation and the Bun 1.4.2 runtime check. Local scripts, screenshots and raw measurements are under ignored `output/playwright/admin-review-20261026/polish-*`; test cookies are removed after verification.

The view-history feature remains subject to the database rollout described in [manga-view-history.md](manga-view-history.md). This UI follow-up does not apply its migration automatically.
