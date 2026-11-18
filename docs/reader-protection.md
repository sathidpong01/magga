# Reader protection and compatibility

MAGGA keeps its existing public R2 image delivery. Reader protection is a browser-side deterrent, not authorization or DRM. It adds no image proxy, per-image API, external service, watermark, image transformation, tracking request, or database query.

## Behavior

- Reader images have `data-magga-protected-image` and `draggable="false"` in the initial HTML. Static CSS suppresses selection, dragging and the iOS callout where supported, before hydration. The reader marker matches the actual rendered container.
- Context-menu, drag and copy prevention applies to marked reader images. Search, links, buttons, ordinary text, forms, contenteditable regions, textbox roles and explicit `data-magga-allow-copy` regions remain usable.
- Ctrl/Command shortcuts for inspection, source and saving are intercepted where possible while a reader is present. Shortcut events never establish that inspection actually opened. Select-all, printing, scrolling, pinch zoom and composing text remain available.
- Print CSS hides the reader artwork and its reminder from ordinary print/Save-as-PDF output. It does not stop screenshots, alternative renderers or modifications to CSS.
- Window-size polling runs only with positive desktop pointer/hover support, without touch/mobile/in-app signals, in a visible focused document. It pauses on blur, pagehide and visibility changes, resets after resize/restoration, and cleans up on route changes and unmount.
- A stable size gap can only show a dismissible reminder in a Portal. It never denies access, locks scrolling or claims confirmed DevTools use. Missing capabilities leave the page readable.
- Existing admin, development and Lighthouse runtime exemptions remain. Static image attributes/CSS still ship in HTML for all viewers.
- Age confirmation still appears if browser storage is blocked. Confirming dismisses it for the mounted page session even when the preference cannot be persisted.
- WebViews without IntersectionObserver keep their server-rendered pages; automatic current-page tracking is unavailable there.
- Existing `frame-ancestors 'self'` prevents embedding the HTML reader in unrelated origins where CSP is supported. It does not prohibit in-app WebViews or image hotlinking. Public catalog/card responses must not include full reader page lists.

## Compatibility inventory

| Group | Coverage strategy |
| --- | --- |
| Windows, macOS, Linux, ChromeOS browsers | Standard image attributes/events; Ctrl/Command handling; desktop geometry is advisory only |
| iPhone/iPad browsers | Callout CSS when supported; touch-capability fallback including iPad desktop User Agents |
| Android browsers, including Brave/Firefox/Samsung Internet | Standard events plus mobile/touch signals; no geometry polling |
| Facebook, Messenger, Instagram, LINE, TikTok, X, Telegram, WeChat, Google/mail app browsers | Capability checks plus conservative known in-app hints; native app menus remain outside page control |
| Android Custom Tabs, WKWebView, other WebViews, Electron/CEF wrappers | Browser capability fallback; never require a particular browser brand |
| Home-screen/standalone/PWA windows | Same initial HTML/CSS and lifecycle handling; no new service worker/offline cache |
| Tablets, foldables, touch laptops and external keyboards | Touch takes precedence over desktop identity; preserve gestures and editable controls |
| Private modes, blocked storage/cookies, Shields/extensions | No protection-state persistence or new cookie/storage dependency |
| Old/limited browsers, TVs, consoles, e-ink devices | Initial HTML/CSS where supported; unsupported detection does not deny reading; full app support depends on existing framework/browser compatibility |

Entry paths include direct URLs, search/share/QR links, client navigation, new tabs, back/forward restoration, background/foreground transitions and reading-progress anchors. No list of brand names guarantees compatibility with every app/version; capabilities are the primary mechanism.

## Verification and remaining device checks

Automated tests cover representative User Agents and pointer capabilities, image/control scope, selection copying, Windows/macOS shortcuts, mobile toolbar/keyboard changes, resizing, zoom, focus/visibility, pagehide/pageshow, cleanup/reinstallation, runtime exemptions, reminder dismissal, initial HTML and public card responses.

Local verification on 2026-11-18 passed:

| Check | Result |
| --- | --- |
| Bun 1.4.2 full suite | 735 tests passed across 98 files |
| ESLint and TypeScript | Passed |
| Production build with disposable PGlite/Postgres fixture | Passed; existing Next.js security upgrade warning remains |
| Chromium, Firefox, desktop WebKit | All three passed image/control event scope, copied selections, non-blocking shortcuts, print/screen CSS, card API shape, client navigation/back restoration and blocked local/session storage with age confirmation |
| Per-engine device/app simulations | iPhone Safari identity, Brave Android viewport, Facebook and LINE User Agents, iPad desktop identity with touch all passed without a geometry warning or denial screen |
| JavaScript disabled | Initial image markers, `draggable=false` and CSS verified. Next.js streamed Suspense content remained hidden without its JavaScript reveal; this is not a verified full no-JavaScript reading experience |
| Controlled desktop geometry reminder | Reader remained visible, reminder was portaled to body, dismissal worked without an access-denied screen |

These checks used synthetic local content and the application's production build, not production data. The HTTP-only loopback browser fixture removes only the `upgrade-insecure-requests` response directive to avoid WebKit upgrading local asset requests to an unavailable HTTPS endpoint; the app's real CSP/configuration is unchanged and `frame-ancestors 'self'` was verified. Reader event checks dispatched cancelable DOM events; native browser/app menus require the device checks below. The three desktop engines did not expose the iOS-only callout property, so native iOS callout suppression is not certified by these results.

A User Agent or viewport simulation is not a physical-device/native-app test. Browser artifacts are local and ignored under `output/playwright/`.

Physical-device checks remain required on Brave/Chrome/Firefox Android, Safari iPhone/iPad, and Facebook/LINE on both platforms. Additional apps need individual results before being called tested. Exercise long press, native Save/Share, scroll, pinch zoom, rotation, desktop-site mode, keyboard, multiple tabs, back/forward, background restoration, blocked storage and a long reading session.

## Limits

The public R2 URL remains accessible outside the reader. Direct image requests, HTTP clients, download tools, bots, extensions, disabled/modified JavaScript or CSS, native app menus, remote/undocked inspection, saved copies, reader/translation proxies, screenshots, screen recording and external cameras cannot be reliably prevented by this browser-only design. CSS remains partially useful without JavaScript, but cannot turn public assets into private assets. Some existing Next.js streamed content requires JavaScript to reveal its server-rendered HTML; supporting a complete no-JavaScript app is outside this browser-deterrent change.

Do not reintroduce full-screen denial based on dimensions, debugger timing or a browser/app name. Do not add touchstart/touchmove cancellation, gesture-blocking overlays, canvas conversion or per-image network checks to compensate for these limits.

References: [MDN callout CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/-webkit-touch-callout), [MDN contextmenu exceptions](https://developer.mozilla.org/en-US/docs/Web/API/Element/contextmenu_event), [MDN browser capability detection](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Browser_detection_using_the_user_agent), [WebKit inspectable app content](https://webkit.org/blog/13936/enabling-the-inspection-of-web-content-in-apps/).
