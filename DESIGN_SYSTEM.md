# Magga Design System & Theme Specification

This document defines the official design system, visual identity, component patterns, and styling rules for **Magga**. All new pages, components, and refactorings must adhere strictly to this specification.

---

## 1. Visual Identity & Brand Philosophy

- **Style**: Tailspace 3:4 Anatomy x Charcoal Neutral Dark with Muted Amber accents.
- **Atmosphere**: Professional, readable, dark manga archive that avoids harsh pitch black (`#000000`) and reduces eye strain.
- **Rule of Thumb**: Focus attention on manga artwork. Avoid visual clutter and decorative overlays on covers.

---

## 2. Color Palette & Design Tokens

Single Source of Truth: [`lib/design-tokens.ts`](file:///d:/Project/magga/lib/design-tokens.ts)

### Primary Neutral Palette (Charcoal Dark)

| Token Name | Hex / Value | Purpose / Usage |
| :--- | :--- | :--- |
| `maggaColors.background` | `#141416` | Main page background (Charcoal Neutral Dark) |
| `maggaColors.surface` | `#1e1e22` | Cards, popovers, containers, collapsed panels |
| `maggaColors.surfaceElevated`| `#26262c` | Dropdowns, dialogs, modals, floating menus |
| `maggaColors.border` | `rgba(255, 255, 255, 0.08)` | Standard subtle borders for cards & dividers |
| `maggaColors.borderStrong` | `rgba(255, 255, 255, 0.14)` | Focused/active input borders |

### Accent Palette (Archive Gold / Muted Amber)

| Token Name | Hex / Value | Purpose / Usage |
| :--- | :--- | :--- |
| `maggaColors.archiveGold` | `#d97706` | Primary action buttons, active tags, highlights |
| `maggaColors.archiveGoldHover`| `#f59e0b` | Hover states for buttons, links, author names |
| `maggaColors.archiveGoldSoft` | `rgba(217, 119, 6, 0.15)` | Selected menu item backgrounds, active chip bg |
| `maggaColors.archiveGoldBorder`| `rgba(217, 119, 6, 0.35)` | Active borders, focused inputs, card hover glow |

### Typography Colors

| Token Name | Hex / Value | Purpose / Usage |
| :--- | :--- | :--- |
| `maggaColors.textPrimary` | `#f4f4f5` | Headings, titles, main text (Off-white) |
| `maggaColors.textSecondary` | `#a1a1aa` | Subtitles, authors, metadata, labels (Muted slate) |
| `maggaColors.textMuted` | `#71717a` | Inactive icons, timestamps, placeholders |

> [!CAUTION]
> ### ⛔ No Purple Policy (ห้ามใช้สีม่วงโดยเด็ดขาด)
> Any usage of `#8b5cf6`, `#7c3aed`, `#a78bfa`, `rgba(139, 92, 246, ...)`, `fandomViolet`, or purple drop-shadows is **strictly forbidden**. The brand color is **Archive Gold** (`#d97706` / `#f59e0b`).

---

## 3. Radii, Shadows & Motion

```typescript
export const maggaRadii = {
  sm: 4,        // Small tags
  md: 8,        // Buttons, form fields, chips
  card: 10,     // Manga cards (Tailspace style)
  lg: 16,       // Modals, author hero card
  pill: 50,     // Rounded pill badges & social links (9999px)
};

export const maggaShadows = {
  cardHoverLift: "0 8px 24px -4px rgba(0, 0, 0, 0.5)",
  cardAmberHoverLift: "0 8px 24px -4px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(217, 119, 6, 0.35)",
  goldGlow: "0 0 20px rgba(217, 119, 6, 0.3)",
};
```

---

## 4. Component Standards

### A. Manga Card (`MangaCard.tsx`)
1. **Aspect Ratio**: Must be strictly **3:4** (`aspectRatio: "3/4"`).
2. **Category Badge**:
   - Placed on the **top-right of the cover**.
   - Style: Frosted glass (`bgcolor: "rgba(18, 18, 22, 0.85)"`, `backdropFilter: "blur(8px)"`, border: `1px solid rgba(255, 255, 255, 0.15)`).
   - Dimensions: Height `28px`, font size `0.8rem`, `fontWeight: 600`, `borderRadius: "6px"`.
3. **No Over-Cover Overlay**: Do NOT place large gradients or titles covering the artwork.
4. **Title**:
   - Placed **below** the cover image.
   - Strictly **1 line**: `whiteSpace: "nowrap"`, `overflow: "hidden"`, `textOverflow: "ellipsis"`.
   - Font size: `0.92rem`, `fontWeight: 500`.
5. **Author Line**:
   - Placed **below** the title.
   - Strictly **1 line**: `whiteSpace: "nowrap"`, `overflow: "hidden"`, `textOverflow: "ellipsis"`.
   - Clickable link: `/?author=${encodeURIComponent(authorName)}`.
   - Fixed `minHeight: "1.2rem"` to prevent Cumulative Layout Shift (CLS).
6. **Stats Row**:
   - Rating ⭐ (amber `#f59e0b`), Views 👁️ (`textSecondary`), Comments 💬.

### B. Dedicated Author Header Card (`AuthorHeaderCard.tsx`)
- **Breadcrumbs**: `หน้าแรก > ผู้แต่ง > [ชื่อผู้แต่ง]` at the top of the page.
- **Hero Card**: `#17181c` surface with `14px` border radius and `1px solid rgba(255, 255, 255, 0.08)`.
- **Top Row**:
  - Title: Large bold author name (`variant="h1"`, fontSize `2rem`).
  - Badge: Pill badge beside name (`นักวาด / ผู้แต่ง` in emerald `#34d399` or `นักวาด / ผู้แต่งแนะนำ` in gold `#fbbf24`).
  - Dismiss Button: "แสดงผลงานทั้งหมด" (links to `/` to clear filter).
- **Subtitle**: `{author.mangaCount} ผลงาน · อัปเดตโดยผู้ดูแลระบบ`.
- **Social Pills**: Pill-shaped external links with platform-specific branding (Patreon, X, Telegram, Pixiv, Website).

### C. Search & Filter Bar (`SearchFilters.tsx`)
- **Main Bar**: Compact search input with upfront search icon and collapsible "ตัวกรอง & แท็ก" button.
- **Preserve Author**: Filter actions must preserve `?author=...` if currently on an author page.
- **Mount Safety**: Use `isInitialMount` ref to prevent clearing query params on initial render.
- **Placeholder**: Adapts dynamically (e.g. `ค้นหาในผลงานของ [ผู้แต่ง]...` when viewing an author).

### D. Header & Navigation (`Header.tsx`)
- Sleek height: `56-60px`.
- Scrolled state: Frosted backdrop blur `rgba(20, 20, 22, 0.9)` with `1px` subtle bottom border.
- Buttons: `borderRadius: 8px`, Muted Amber accents.

### E. Footer (`Footer.tsx`)
- Surface: `#111113` with `1px solid rgba(255, 255, 255, 0.08)` top border.
- Clean layout with policy links and copyright. No purple drop-shadows.

---

## 5. Performance & Cumulative Layout Shift (CLS) Rules

1. **Floating / Fixed Widgets**:
   - Always wrap floating widgets (e.g. Cookie Consent, floating notices) in MUI's `<Portal>` so they render into `document.body` outside of the page document flow.
   - Use fixed width (e.g. `width: { xs: "calc(100% - 24px)", sm: 320 }`) to prevent width reflows.
2. **Dynamic Text & Metadata**:
   - Always specify `minHeight` on title and author boxes so cards maintain consistent heights regardless of text length.
3. **Skeletons**:
   - Skeletons must exactly match the dimensions and margins of the real rendered component.
