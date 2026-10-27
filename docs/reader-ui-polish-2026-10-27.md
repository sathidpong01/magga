# Reader UI corrections — 2.28.5

## Corrections

- The resume notice fits narrow screens, wraps its text safely and uses 44px actions. It stays compact (about 70px in the test fixture), and the gold action uses a dark readable foreground.
- Share controls have a 44px target and labelled menu relationships. Opening focuses the first item; Escape restores the trigger without scrolling. A cancelled native share returns quietly; a failed native share can open the fallback menu using the captured trigger, even after awaiting the native API.
- Emoji popover dimensions are reserved before its lazy content loads. Its paper and picker fit the viewport and have a named dialog role. This fixes a confirmed 320px case where the picker started at x=80 with width 280, extending to x=360. It now starts at x=24 and ends at x=304. Opening does not move the page.
- Comment nickname/report fields have larger touch areas. Long comment and credited author names wrap safely, and attachment previews have an accessible dialog name. The comments section uses a section-level heading.
- Reader credits reuse the existing defensive social-link parser, so null/non-object legacy entries do not crash rendering. No query or schema change is needed.
- Reader hero loading now uses the rendered 4:8 mobile / 3:9 desktop columns, the same cover limit and padding, a collapsed-details placeholder and the actual 16px reader top margin. It replaces the old full-width mobile cover and obsolete metadata blocks.
- The back-to-top control has a 44px minimum target and respects reduced-motion preference.

## Validation

Used a fresh guarded disposable database with synthetic images, eight dimensioned reader pages, long author/comment names, an image comment and malformed credit entries. Browser requests were limited to same-origin GET/HEAD, blocking view/rating/comment/advertisement writes. No production data was changed.

- Six viewport widths: 320, 390, 768, 1024, 1280 and 1920px. All reader responses were HTTP 200, with no document overflow or uncaught page errors. Pages retain their full viewport width below 1200px and 1000px maximum above it.
- Share focus restoration passes at every width. Saved-position notices stay within screen bounds; actions measure 44px high. Mobile startup shift samples were empty; desktop samples were very small (maximum approximately 0.00011), not an absolute zero guarantee.
- Comments, report defaults, emoji popovers and attachment previews pass at 320, 390 and 1280px. Emoji and image dialogs have names. Emoji opening has a 0px scroll delta.
- Rating activation renders all five labelled 44×44px stars without document overflow. Rating submission, voting and comment creation were not performed.
- Controlled native-share stubs confirm cancellation opens no fallback and other failures open one menu. No external sharing was performed.
- A malformed-credit fixture renders HTTP 200 with eight pages. A controlled image failure displays retry; retry loads the original 480px-wide source successfully.
- Full suite during this correction: 558 passed, 0 failed (1,757 assertions). Final lint and production build including TypeScript pass; focused author-link tests and frozen installation pass.

Image files, original reader URLs, image quality and lazy-loading behaviour are preserved. Synthetic images cannot establish production LCP, and legacy pages without recorded dimensions can still shift when their natural aspect ratio differs from the fallback. Exact title/credit heights and every slow-loading skeleton transition cannot be guaranteed without the corresponding content. No additional polling, dependency, database endpoint or schema was introduced. Changes remain local and unpushed; no deployment or production migration was performed.
