# Accessibility audit — 2026-10-27

Scope: production public pages and the signed-in administrator UI, including the reader layout. Engine: axe-core 4.11.2, WCAG 2 A/AA, WCAG 2.1 A/AA, WCAG 2.2 A/AA, best-practice rules, and the explicitly enabled experimental `label-content-name-mismatch` rule. Automated scanning is not a WCAG conformance certification.

## Coverage

29 route visits (the dashboard alias redirects to admin), plus advertisement, author, and metadata creation dialogs without submitting data:

- Home, author filter, category, tag, reader, privacy, terms, report, changelog, synthetic 404.
- Sign-in, registration, account settings, profile, profile comments.
- Dashboard, manga submission, own submissions.
- Admin overview, manga list, create/edit manga, submissions, comments, authors, categories/tags, users, advertisements, MCP drafts.

## Changes

- Give advertisements and floating reader controls named landmarks.
- Correct page and subsection heading semantics without changing their visual size.
- Add avatar/favicon alternatives, correctly label checkbox inputs and advertisement selects, and name author social lookup buttons.
- Raise low-contrast text using existing design tokens.
- Make profile image selection keyboard accessible and use native buttons to open manga file pickers.
- Keep the reader's synopsis, tags and credits permanently visible. Place them beside the cover below the reading controls on desktop; use the full width below the cover/title on mobile. Match the loading skeleton to the same grid geometry.

## Verification and limitations

Raw before/after axe results and screenshots are local ignored artifacts under `output/playwright/compact-stats/`; they may contain account-specific DOM and are intentionally not committed.

MUI modal focus-trap sentinels can trigger experimental `focus-order-semantics`; these require manual focus checks rather than removing the focus trap. Contrast over gradients and images can be reported as incomplete and needs visual/manual review. Empty moderation lists do not exercise populated comments/submissions, every user role, or every content-dependent state. No audit forms were submitted, no content was deleted, and no account settings were saved.

Validation results and production recheck are recorded in the task's final report.
