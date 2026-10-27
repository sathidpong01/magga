# Admin workspace and deployment follow-up

## Delivered behavior

- Admin lists use server search and pages of 20 or 50 records. Option pickers load bounded results when needed. Existing legacy API response shapes remain available for compatibility.
- Overview counts and moderation queues use bounded queries. User counts are grouped for the current page. Comments use the server-provided first page without an immediate duplicate request.
- Desktop retains table columns, quick actions, keyboard controls and a separate image workspace. Mobile lists retain the same actions in a compact layout.
- Manga creation/editing and submission show information first on mobile. At desktop widths the image workspace receives the larger left column. Page previews preserve the whole image; reordering supports dragging and explicit move controls.
- Dirty forms warn before leaving. Returning to lists restores recent filters and position locally. No cross-device sync, read-later feature, polling service, database migration or new paid service was introduced.

These changes bound work per interaction and suit the existing Hobby deployment. They do not establish a measured percentage reduction in production usage. Legacy unpaged endpoints still need care if reused by future callers.

## Vercel failure evidence and repair

Production deployment `dpl_7UbkXifmmefPvGdQtWR51mGEdpUp`, source `23143f66a0f9e5c44b3998e1a2373f7d43bc1ac1`, failed its type check. The preceding deployment also reported Better Auth type errors.

1. `MangaDataTable` referenced removed `allCategories`. It now reads the category ID already returned by the joined list query.
2. Better Auth's UUID generator belongs at `advanced.database.generateId`. The generator behavior is retained at the supported location.
3. Remote logs referenced root and nested copies of `@better-auth/core`. Better Auth, its Drizzle adapter and core are now pinned together at 1.7.13, with a core override. A build preflight rejects inconsistent versions or separate core resolutions. A compile-time contract verifies the session fields used by authorization and account flows.

A clean Windows install of the prior lockfile did not reproduce the remote duplicate-core layout. Its exact origin, including whether restored cache caused it, remains unconfirmed. A new remote deployment is required to establish that Vercel is fixed. If the preflight reports an old nested core on that deployment, retry with its build cache disabled.

Local/CI runtime remains Bun 1.4.2. Vercel selected 1.4.4 in the failed build; its supported Bun configuration accepts a release range and manages patch versions. The patch difference alone is not established as the cause.

## Validation

- Bun 1.4.2 runtime check and frozen install passed.
- Clean-install auth preflight and TypeScript check passed in a separate temporary checkout.
- Lint passed; 549 tests passed, zero failed.
- Full production build passed using a fresh disposable database and synthetic data, without production credentials.
- Browser verification artifacts are local under `output/playwright/admin-review-20261026/`; the final route pass covered 13 routes at 390 and 1440 pixels with no horizontal overflow or uncaught page errors. Synthetic editor save returned HTTP 200; page reordering worked. Preview width measured 310 pixels on desktop and 282 on mobile, with information preceding images on mobile. Cancellation of link navigation and browser departure retained unsaved input. The member-list simulated outage showed retry feedback rather than false empty results. The MCP approval dialog required its confirmation checkbox. Comments made zero duplicate initial list requests.
- Real object-storage uploads and a new Vercel deployment have not been tested in this follow-up.

`bun audit` still reports 20 advisories (5 high, 10 moderate, 5 low), involving transitive versions of busboy, undici, esbuild and Zod. These are separate from the deployment type errors; the direct Zod version is 4.6.7 while older nested versions remain. `bun outdated` also reports newer packages. This patch does not broadly upgrade unrelated dependencies.

Version: 2.27.1. Follow-up changes remain local pending repository delivery.

References: [Better Auth options](https://better-auth.com/docs/reference/options), [Vercel Bun runtime](https://vercel.com/docs/functions/runtimes/bun).

## Dependency isolation follow-up (2.27.2)

Vercel CLI was removed from the root package and moved to the independent, optional `tools/vercel/` package, pinned at 65.3.1 with its own lockfile. The isolated package retains the applicable existing same-major security overrides and pins its Zod 4 consumers at 4.6.7. It is not a root workspace and is excluded by `.vercelignore`. Ordinary web installs do not install this CLI dependency tree.

The root command `bun run vercel <arguments>` checks the installed version and runs the isolated CLI with the repository root as its working directory. `env:sync` uses the same resolver, preserving explicit key selection, target selection and stdin-only values. Missing/wrong tooling installations produce a setup instruction. Dry runs need no tooling installation and never write environment values remotely.

Measured audit results after the split:

| Dependency tree | Remaining advisories |
| --- | --- |
| Root web/development project | 1 moderate: esbuild 0.18.20 through Drizzle Kit's legacy loader |
| Optional Vercel CLI | 18: 5 high, 9 moderate, 4 low, from busboy, undici and Zod 3 |

This is dependency isolation, not a claim that the CLI advisories have been fixed. The CLI no longer contributes these transitive packages to the web project's lockfile. Its audit remains visible and must be revisited before tool upgrades.

Drizzle Kit 0.31.11 is still the current stable version and declares the legacy loader. Its esbuild advisory requires an affected development server. Repository workflows use Next's development server and use Drizzle for schema/configuration commands; no esbuild serve call was found. This is static evidence only. A global override from esbuild 0.18 to 0.25+, replacing Zod 3 with 4, or replacing Undici 5 with 6 would exceed declared compatibility ranges; no such override was added. Follow an upstream Drizzle release that removes/fixes the loader rather than forcing an API change solely to clear audit output.

Validation: root and isolated frozen installs, Bun 1.4.2 runtime check, auth preflight, CLI `--version` (65.3.1), lint, 550 tests and the full disposable-database production build passed. A fresh temporary root-only install also passed the auth preflight with no Vercel package installed. The fixture build exercised the retained Drizzle TypeScript configuration/schema path. CLI authentication, deployment, and real environment writes were not invoked. There was no production database migration or deployment.
