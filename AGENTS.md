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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
