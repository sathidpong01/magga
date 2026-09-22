# Project Agent Instructions

## graphify

- **graphify** (`~/.Codex/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
- When the user types `/graphify`, invoke the Skill tool with `skill: "graphify"` before doing anything else.

## Version Bump Policy

Every agent change must update the project version before completion.

- Bump `package.json` and `package-lock.json` for every bug fix, feature update, behavior change, dependency update, optimization, UI change, documentation change that affects project behavior/workflow, or other user-requested project edit.
- Use semantic versioning:
  - `patch` for bug fixes, dependency refreshes, small UI/copy/docs/workflow updates, and low-risk maintenance.
  - `minor` for user-visible features, new routes, new settings, new API capabilities, or compatible behavior additions.
  - `major` for breaking changes, data migrations that require manual intervention, or incompatible API/behavior changes.
- Prefer `npm version patch|minor|major --no-git-tag-version` so `package.json` and `package-lock.json` stay in sync.
- If a task edits code but intentionally should not change the version, state the reason clearly in the final response.

## Development Workflow

- Read the relevant project files before editing; prefer existing patterns over new abstractions.
- Keep changes scoped to the requested task.
- Run focused validation after changes. Use `npm run lint` and `npm test` when feasible; add `npm run build` for release-sensitive or framework/package updates.
- For dependency updates, run `npm outdated --json` after installation and report any remaining audit risk separately from outdated packages.

## Design System & Theme Guidelines

All frontend pages, components, and modifications MUST strictly comply with Magga's design system:

1. **No Purple Policy (ห้ามใช้สีม่วงโดยเด็ดขาด)**:
   - Do NOT use purple or violet colors (`#8b5cf6`, `#7c3aed`, `#a78bfa`, `rgba(139, 92, 246, ...)`, `fandomViolet`, or any purple class/token).
   - The primary brand color is **Archive Gold** (`#d97706` / hover `#f59e0b`).

2. **Single Source of Truth (`lib/design-tokens.ts`)**:
   - Always import and use tokens from `@/lib/design-tokens` (`maggaColors`, `maggaRadii`, `maggaShadows`):
     - Background: `maggaColors.background` (`#141416` Charcoal Neutral Dark — not pitch black).
     - Surface / Cards: `maggaColors.surface` (`#1e1e22` Charcoal Surface).
     - Elevated Surface: `maggaColors.surfaceElevated` (`#26262c`).
     - Accent Gold: `maggaColors.archiveGold` (`#d97706`) / `archiveGoldHover` (`#f59e0b`) / `archiveGoldSoft` (`rgba(217, 119, 6, 0.15)`).
     - Text: `maggaColors.textPrimary` (`#f4f4f5`), `textSecondary` (`#a1a1aa`), `textMuted` (`#71717a`).
     - Borders: `maggaColors.border` (`rgba(255, 255, 255, 0.08)`).

3. **Manga Card & Grid Standard (Tailspace 3:4 Anatomy)**:
   - Cover Aspect Ratio: **3:4 aspect ratio** with `10px` border radius (`maggaRadii.card`).
   - Category Badge: Positioned at top-right of cover image with frosted glass (`backdropFilter: "blur(8px)"`, height `28px`, fontSize `0.8rem`, `fontWeight: 600`).
   - Title: Located **below** the cover image, strictly **1 line** (`whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"`).
   - Author: Located **below** the title, strictly **1 line**, clickable filter linking to `/?author=${encodeURIComponent(authorName)}`.
   - Stats row: Located below author with rating ⭐, views 👁️, and comments.

4. **Author Header Card (สไตล์ Tailspace)**:
   - Breadcrumbs: `หน้าแรก > ผู้แต่ง > [ชื่อผู้แต่ง]` at the top.
   - Hero card in `#17181c` with large bold title (`variant="h1"`), status pill badge, comics count, clear filter button ("แสดงผลงานทั้งหมด"), and platform-branded social link pills (Patreon, X, Telegram, Pixiv, Website).

5. **Layout Shift (CLS) Prevention**:
   - Always specify fixed dimensions or `minHeight` on dynamic content containers (e.g. title/author boxes, search bars).
   - Always wrap floating/fixed widgets (e.g. Cookie Consent) in MUI's `<Portal>` to isolate them from document layout flow.
   - Skeletons must precisely match the rendered component's dimensions.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
