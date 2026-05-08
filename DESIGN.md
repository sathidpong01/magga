---
name: "MAGGA"
description: "A focused Thai furry manga translation hub with immersive public reading and industrial admin control."
colors:
  midnight-canvas: "#0a0a0a"
  charcoal-surface: "#171717"
  iron-surface: "#262626"
  soft-divider: "#404040"
  text-primary: "#fafafa"
  text-secondary: "#a3a3a3"
  text-muted: "#737373"
  archive-gold: "#fbbf24"
  archive-gold-hover: "#f59e0b"
  admin-gold: "#FABF06"
  fandom-violet: "#8b5cf6"
  trust-emerald: "#10b981"
  danger-red: "#ef4444"
typography:
  display:
    fontFamily: "Kanit, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "normal"
  headline:
    fontFamily: "Kanit, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "Kanit, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "normal"
  body:
    fontFamily: "Kanit, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: "Kanit, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.02em"
rounded:
  sm: "4px"
  md: "8px"
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
    textColor: "{colors.midnight-canvas}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.archive-gold-hover}"
    textColor: "{colors.midnight-canvas}"
    rounded: "{rounded.md}"
  manga-card:
    backgroundColor: "{colors.midnight-canvas}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    width: "100%"
  surface-card:
    backgroundColor: "{colors.charcoal-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "24px"
  admin-surface:
    backgroundColor: "{colors.charcoal-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "20px"
  filter-panel:
    backgroundColor: "{colors.charcoal-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "16px"
  category-chip:
    backgroundColor: "{colors.archive-gold}"
    textColor: "{colors.midnight-canvas}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: "20px"
---

# Design System: MAGGA

## 1. Overview

**Creative North Star: "Trusted Fandom Archive"**

MAGGA is a dark, focused archive for Thai-translated furry manga and doujin works. The public surface should feel immersive and reader-first: covers, manga pages, authors, categories, tags, and comments do the visual work. Interface chrome stays quiet so the archive feels curated, not noisy.

The admin surface is allowed to feel more industrial: compact, dark, gold-led, table-friendly, and built for repeated moderation work. Public screens should never inherit a generic dashboard mood. Admin screens can be dense, but they still need the same credibility and restraint as the reader experience.

This system rejects the exact anti-references in PRODUCT.md: manga sites overloaded with ads, generic SaaS dashboards, and low-quality 18+ sites that feel suspicious or disposable. Mature content should be presented with control, clarity, and enough polish to feel trustworthy.

**Key Characteristics:**

- Dark neutral canvas with gold used as a directional signal.
- Manga covers and reader pages are the main visual asset.
- Public UI is immersive; admin UI is industrial and compact.
- Forms, filters, and tables stay focused and credible.
- Motion is present only as feedback, not spectacle.

## 2. Colors

The palette is a dark archive system: neutral blacks carry the reading environment, gold marks action and category priority, violet and emerald remain secondary signals.

### Primary

- **Archive Gold**: Main action color for submit buttons, selected tabs, category chips, loading indicators, and admin emphasis.
- **Admin Gold**: Stronger admin variant used where the dashboard needs more mechanical contrast and table-state clarity.

### Secondary

- **Fandom Violet**: Public brand accent inherited from the MUI theme. Use for supporting emphasis, changelog accents, and places where gold would overstate importance.
- **Trust Emerald**: Positive state color for connected, approved, or successful status. Use sparingly so it keeps meaning.

### Tertiary

- **Danger Red**: Warning, ban, delete, rejection, and destructive action signal. Never use it as decoration.

### Neutral

- **Midnight Canvas**: Root background for the site, reader pages, auth shells, and full-screen loading states.
- **Charcoal Surface**: Primary panel, card, paper, dialog, and dashboard surface.
- **Iron Surface**: Secondary field and hover surface for dark controls.
- **Soft Divider**: Input borders, muted separators, and low-contrast outlines.
- **Text Primary**: Main text on dark surfaces.
- **Text Secondary**: Supporting labels, metadata, helper text, and subdued navigation.
- **Text Muted**: Timestamps, inactive controls, and low-priority captions.

### Named Rules

**The Gold Is Navigation Rule.** Gold marks a path, a selected state, or a meaningful action. Do not use it as ambient decoration across a whole screen.

**The Dark Archive Rule.** Backgrounds stay neutral and deep. Avoid saturated full-screen color fields that compete with manga covers.

**The Mature Trust Rule.** Red and neon-like colors are functional only. If a screen starts to resemble a low-trust 18+ site, remove saturation before adding more UI.

## 3. Typography

**Display Font:** Kanit, with sans-serif fallback
**Body Font:** Kanit, with sans-serif fallback
**Label/Mono Font:** Kanit for labels; monospace appears only for technical values such as dates or ids

**Character:** Kanit gives MAGGA a Thai-first, rounded, approachable voice while still supporting dense admin screens. Weight and spacing create hierarchy; decorative type changes are not part of the system.

### Hierarchy

- **Display** (700, 2.5rem and larger, 1.1 line-height): Page titles, manga title hero areas, and special states such as 404.
- **Headline** (700, 2rem, 1.2 line-height): Section leads and admin page headings.
- **Title** (600, 1.25rem, 1.25 line-height): Card names, form section titles, panel headers, and manga reader metadata.
- **Body** (400, 1rem, 1.7 line-height): Descriptions, policy text, reader-adjacent prose, comments, and settings copy. Keep long body text to roughly 65-75 characters per line when possible.
- **Label** (700, 0.8rem, 0.02em letter-spacing): Chips, table headers, metadata labels, compact controls, and admin status markers.

### Named Rules

**The Thai Readability Rule.** Never compress Thai body text to look sleek. If a label or paragraph becomes cramped, give it more space before reducing legibility.

**The Weight Before Decoration Rule.** Use weight, size, and placement for hierarchy. Do not introduce decorative fonts or gradient text.

## 4. Elevation

MAGGA uses a hybrid elevation model: immersive public screens rely on cover overlays, gradients, and tonal layering, while admin screens use flat industrial panels with thin borders and occasional gold focus. Shadows appear mostly on hover, auth panels, cover thumbnails, and strong overlay moments.

### Shadow Vocabulary

- **Card Hover Lift** (`box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.4)`): Optional hover response for cards that need tactile feedback.
- **Gold Glow** (`box-shadow: 0 0 20px rgba(251, 191, 36, 0.4)`): Use only for primary call-to-action hover or rare emphasis.
- **Auth Panel Depth** (`box-shadow: 0 25px 60px rgba(0,0,0,0.5)`): Use for centered auth surfaces and major account flows.
- **Thumbnail Lift** (`box-shadow: 0 4px 12px rgba(0,0,0,0.3)`): Use under small cover images in admin tables and lists.

### Named Rules

**The Industrial Admin Rule.** Admin panels are flat at rest, bordered, and compact. Shadows are secondary to structure.

**The Immersive Public Rule.** Public cards and reader surfaces should let images create depth. UI shadows must not overpower cover art.

## 5. Components

### Buttons

- **Shape:** Public theme buttons can inherit the rounded app shape (16px), but admin and form buttons should usually use tighter industrial corners (8px).
- **Primary:** Gold background with dark text, bold label, and compact padding. Use for submit, save, selected tab, and high-confidence actions.
- **Hover / Focus:** Gold darkens from archive gold to archive gold hover. Focus must be visible through border, outline, or strong contrast, never only color.
- **Secondary / Ghost / Tertiary:** Use transparent or dark surfaces with thin borders for lower priority actions. Do not make every action gold.

### Chips

- **Style:** Category chips use gold with dark text. Metadata chips use tinted low-opacity backgrounds, colored text, and thin borders.
- **State:** Selected chips need a clear tonal change. Filter chips must remain readable at small sizes and must not depend on hover-only affordances.

### Cards / Containers

- **Corner Style:** Manga cards use 8px corners to preserve cover shape. Public panels use up to 16px where the theme already does. Admin panels stay at 8px.
- **Background:** Manga cards sit on midnight canvas with full-cover imagery. Utility panels use charcoal surface. Admin list/table surfaces use charcoal or near-black bands.
- **Shadow Strategy:** Public cards may lift on hover. Admin containers should rely on borders and tonal contrast.
- **Border:** Use thin translucent white borders around panels and admin containers. Do not use thick colored side stripes.
- **Internal Padding:** Compact tools use 8-16px; forms and settings panels use 24px.

### Inputs / Fields

- **Style:** Dark field background, light text, muted border, and 8px radius. Standard filters may use underline-only inputs inside the filter panel.
- **Focus:** Gold border or indicator. Focus must be strong enough for WCAG A keyboard use.
- **Error / Disabled:** Red for error, muted gray for disabled. Disabled gold buttons should reduce contrast and not look actionable.

### Navigation

- **Style:** The public header is sticky and visually transparent until scroll, then becomes a dark gradient veil. It should support reading, not frame the page like a corporate app.
- **Typography:** Navigation labels are compact and bold enough to scan.
- **Default / Hover / Active:** Gold marks submit and selected states. Admin uses red or gold only when role and context demand it.
- **Mobile Treatment:** Controls must collapse without hiding essential login, submit, search, or filter paths.

### Manga Card

Manga cards are the signature public component. They use a 2:3 cover ratio, full-image background, bottom black gradient overlay, two-line clamped title, compact view/rating metadata, and optional top-right category chip. The card should feel like a book spine or cover on a shelf, not a generic content tile.

### Filter Panel

The filter panel is compact by default and expands when needed. It should feel like a reader tool, not a search landing page. Keep labels short, controls predictable, and transitions restrained.

### Admin Table Surface

Admin tables use dense row spacing, small uppercase-like labels, dark bands, gold active indicators, and muted borders. They are work surfaces, not marketing sections.

## 6. Do's and Don'ts

### Do:

- **Do** keep manga covers, reader pages, authors, tags, and categories visually central.
- **Do** use archive gold for directional actions and selected states.
- **Do** keep public pages immersive and admin pages industrial.
- **Do** preserve WCAG A minimum behavior: readable contrast, visible focus, keyboard-operable controls, and non-hover alternatives.
- **Do** keep mobile reading and image-heavy performance in mind before adding motion, shadows, or extra client-side UI.
- **Do** use thin borders, tonal surfaces, and compact spacing for admin workflows.

### Don't:

- **Don't** make MAGGA look like a manga site overloaded with ads, popups, confusing banners, or visual clutter.
- **Don't** make public reader and discovery surfaces look like a generic SaaS dashboard.
- **Don't** borrow the untrustworthy visual language common to low-quality 18+ sites: aggressive colors, fake urgency, unreadable layouts, suspicious controls, or throwaway content presentation.
- **Don't** use gradient text. Use solid color, weight, and scale.
- **Don't** use thick colored side-stripe borders on cards, list items, callouts, or alerts.
- **Don't** cover manga art with decorative chrome that does not help reading, discovery, submission, or moderation.
