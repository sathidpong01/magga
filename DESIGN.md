---
name: "MAGGA"
description: "The approved current design of MAGGA, a Thai furry manga translation archive."
colors:
  background: "#141416"
  charcoal-surface: "#1e1e22"
  elevated-surface: "#26262c"
  text-primary: "#f4f4f5"
  text-secondary: "#a1a1aa"
  text-muted: "#71717a"
  archive-gold: "#d97706"
  archive-gold-hover: "#f59e0b"
  trust-emerald: "#10b981"
  danger-red: "#ef4444"
typography:
  author-heading:
    fontFamily: "Kanit, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.167
    letterSpacing: "normal"
  manga-title:
    fontFamily: "Kanit, sans-serif"
    fontSize: "0.92rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
  manga-author:
    fontFamily: "Kanit, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "normal"
  body:
    fontFamily: "Kanit, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  category-label:
    fontFamily: "Kanit, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.03em"
rounded:
  sm: "4px"
  md: "8px"
  card: "10px"
  lg: "16px"
  pill: "50px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.archive-gold}"
    textColor: "{colors.background}"
    rounded: "{rounded.md}"
  button-primary-hover:
    backgroundColor: "{colors.archive-gold-hover}"
    rounded: "{rounded.md}"
  manga-cover:
    backgroundColor: "{colors.charcoal-surface}"
    rounded: "{rounded.card}"
    width: "100%"
  surface-card:
    backgroundColor: "{colors.charcoal-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
  category-chip:
    backgroundColor: "#121216D9"
    textColor: "{colors.text-primary}"
    typography: "{typography.category-label}"
    rounded: "6px"
    height: "28px"
---

# Design System: MAGGA

## Overview

This document records the current design selected and approved by the project owner. Preserve the existing page composition, cover presentation, dark surfaces, gold accents, and Thai typography when fixing usability issues. It is not a redesign brief.

MAGGA serves Thai readers and contributors of translated furry manga and doujin works. Covers and reader pages carry the public visual identity. Search, author filters, categories, tags, and comments remain compact supporting tools. The dashboard uses denser work surfaces for submissions and moderation.

Implementation references:

- [Design tokens](lib/design-tokens.ts): the source of shared color, radius, shadow, and motion values.
- [Design system specification](DESIGN_SYSTEM.md): project component requirements.
- [Public theme](app/components/layout/Providers.tsx) and [root layout](app/layout.tsx): the public Kanit font and theme.
- [Manga card](app/components/features/manga/MangaCard.tsx), [author header](app/components/features/author/AuthorHeaderCard.tsx), [search filters](app/components/features/search/SearchFilters.tsx), and [header](app/components/layout/Header.tsx): the current component appearance.

If this document and the implementation drift, reconcile the documentation with the owner's approved design and project instructions before changing the visuals. Do not introduce new styling merely to satisfy an outdated description.

## Colors

### Primary

Archive Gold (`maggaColors.archiveGold`, `#d97706`) marks actions and selection. Its brighter hover value is `#f59e0b`; hover does not darken the gold. Shared selected backgrounds and borders use `archiveGoldSoft` (`rgba(217, 119, 6, 0.15)`) and `archiveGoldBorder` (`rgba(217, 119, 6, 0.35)`).

Existing auth and dashboard primary buttons use gold gradients from `#f59e0b` to `#d97706`, with darker text. Preserve those established variants rather than replacing every button with one flat style.

### Secondary and status

Trust Emerald (`#10b981`) signals positive status. Danger Red (`#ef4444`) signals errors, bans, rejection, and destructive actions. Author social pills may use their existing platform-specific brand colors. The established author status badges include emerald and brighter gold variants.

### Neutral

- Main background: `maggaColors.background`, `#141416`.
- Shared surface: `maggaColors.surface`, `#1e1e22`.
- Elevated surface: `maggaColors.surfaceElevated`, `#26262c`.
- Text: primary `#f4f4f5`, secondary `#a1a1aa`, muted `#71717a`.
- Shared borders: `rgba(255,255,255,0.08)`; stronger borders: `rgba(255,255,255,0.14)`.

Documented current local variants include author hero `#17181c`, public menu `#18181b`, auth dialog `#16171a`, auth fields `#101012`, and footer `#111113`. These are component-specific surfaces, not replacements for the main background token.

Purple and violet UI accents are prohibited. Use the canonical Archive Gold names for new work. Legacy token aliases are implementation compatibility details, not an alternative palette.

The current muted text value is documented as observed, not certified for all readable text. Essential small text needs sufficient contrast on its actual surface; improving legibility must retain the approved palette and layout.

## Typography

The public interface uses Kanit with a sans-serif fallback. `app/layout.tsx` loads weights 400, 500, and 700 for Thai and Latin; components also request intermediate CSS weights. Do not add another font or font download to resolve a usability issue.

The frontmatter captures the current manga title, author, category label, and author heading sizes. Other headings follow their existing MUI variants and component-specific responsive sizes. The homepage deliberately uses a compact `h6` visual variant for its semantic `h1`; do not replace it with an oversized marketing hero.

Manga titles are `0.92rem`, weight 500, line-height 1.3. Author names are `0.78rem`, line-height 1.25. The Views caption remains `0.72rem` and uses `textSecondary` for improved contrast without changing card geometry.

The dashboard keeps its separate component styling and now explicitly uses the same Kanit font family and heading weights as the public theme.

Keep Thai labels readable, allow form helper text to wrap, and preserve the one-line title/author treatment on manga cards. Use size, weight, and placement for hierarchy.

## Elevation

Use `maggaShadows` from the shared token file:

- `cardHoverLift`: `0 8px 24px -4px rgba(0, 0, 0, 0.5)`.
- `cardAmberHoverLift`: the same lift plus a gold border glow.
- `goldGlow`: `0 0 20px rgba(217, 119, 6, 0.3)`.
- `authPanelDepth`: `0 25px 60px rgba(0,0,0,0.5)`.
- `thumbnailLift`: `0 4px 12px rgba(0,0,0,0.3)`.

Preserve local shadows already used by dialogs, menus, and cover thumbnails. Manga covers lift slightly on hover and the image scales subtly. Shared motion tokens specify short feedback transitions; reduced-motion behavior is supported by the global stylesheet.

## Components

### Manga card and grid

- Cover aspect ratio is **3:4**, with **10px** corners.
- The category badge sits at the top-right, 10px from the edges. It has a dark translucent background, 8px backdrop blur, a thin light border, 28px height, 6px corners, and `0.8rem` text at weight 600.
- Title appears **below the cover**, on exactly one line with ellipsis. Do not put it back over the artwork or use the former two-line treatment.
- Author appears below the title, on one line. Its link filters through `/?author=${encodeURIComponent(authorName)}`. The author container reserves `minHeight: 1.2rem`.
- The stats row below the author currently displays a rating when available and Views. A comment count is not rendered by the current card; do not claim it is implemented.
- The current cover has a subtle bottom vignette. Preserve it; it is not the former large title overlay.
- Mobile discovery uses two columns; wider breakpoints add columns through the existing Grid configuration.

### Author header

Use the existing breadcrumb `หน้าแรก > ผู้แต่ง > [ชื่อผู้แต่ง]`, dark `#17181c` hero, bold author heading, status badge, work count, and clear-filter action `แสดงผลงานทั้งหมด`. Preserve the existing platform-branded social pills and their responsive wrapping.

### Search and filters

Preserve the compact search bar and expandable filter panel. The search placeholder adapts to the selected author. Filter changes retain the author query. On mobile the filter button uses icons while its accessible label identifies the action.

### Header and footer

The public header is sticky, transparent at the top, and uses `rgba(20,20,22,0.9)` with 12px blur and a subtle bottom border after scrolling. Its current toolbar height is 56px on small screens and 60px from the small breakpoint. Desktop shows submit/login controls; mobile exposes the menu.

The footer uses `#111113`, a thin top border, description, policy links, copyright, and existing supporting links. Keep its established composition.

### Buttons, fields, and dialogs

Keep the existing variants: header buttons commonly have 8px corners, auth fields and buttons 10px, auth dialogs 14px, and the dashboard uses its current 10-12px control/panel corners. Shared radii are 4, 8, 10 (cover), 16, and 50px; they do not require every component to have identical corners.

Fields use light text and gold focus borders. Validation, pending states, visible keyboard focus, and usable touch targets are behavior and accessibility requirements; add them without replacing the approved visual treatment.

### Stability and responsive behavior

Use the existing spacing scale and responsive layout rather than a new page grid. Reserve dimensions for dynamic content; skeletons should match rendered content. Fixed widgets such as Cookie Consent use MUI Portal. Verify that text enlargement does not hide essential actions. Keep manga art centered and responsive in the vertical reader.

## Do's and Don'ts

### Do

- Preserve the current owner-approved design while improving usability.
- Import canonical shared tokens for new styling.
- Keep covers and reader pages central, with metadata below the cover.
- Maintain clear focus, accessible names, field-level errors, and recoverable loading failures.
- Verify responsive layouts and text enlargement on the pages actually changed.
- Update this document when an approved design change alters the implementation.

### Don't

- Introduce purple/violet accents or change the main canvas to pitch black.
- Reintroduce 2:3 covers, title overlays, or two-line manga card titles.
- Redesign the homepage, card grid, auth panels, or dashboard as part of a behavior fix.
- Treat observed legacy styles or known usability issues as requirements to preserve defects.
- Add decorative UI that competes with the manga artwork.
- Claim a documented component or accessibility requirement has passed runtime testing without testing it.
