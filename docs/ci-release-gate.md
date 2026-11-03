# Automatic CI and production release gate

GitHub Actions runs `.github/workflows/ci.yml` on every push and pull request. Manual runs remain available. The workflow uses only disposable test data and does not need production credentials.

## Checks required for release

The GitHub check named **CI Gate** summarizes all required work:

- Linux and Windows: frozen dependency installation, Bun runtime verification, lint, typecheck, and tests.
- Linux: a production build against a fresh PostgreSQL service with a verified disposable schema.

The gate runs even when a dependency fails. It accepts only `success` from both the checks matrix and the build; `failure`, `cancelled`, and `skipped` do not pass.

In Vercel, open **magga → Settings → Build and Deployment → Deployment Checks** and require the GitHub **CI Gate** check. Keep production domain auto-assignment enabled. GitHub CI and Vercel build can run in parallel; a completed build waits for the gate before it replaces the live deployment. Preview deployments are independent of this production gate.

## When a check fails

1. Open the failed run in [GitHub Actions](https://github.com/sathidpong01/magga/actions/workflows/ci.yml), then open the first failed step in `checks` or `build`. `CI Gate` reports the overall result; the dependency's log contains the cause.
2. Fix the cause, run the relevant local checks, commit, and push. The new commit automatically starts another run and Vercel deployment. The previous production version remains live while checks are incomplete or failing.
3. Verify that **CI Gate** succeeds and the matching Vercel deployment becomes the current production deployment. For a transient runner or network failure, rerun the failed workflow jobs and verify the release afterward.

Do not use **Force Promote** to bypass a failed or pending gate. A successful local test run does not replace the GitHub check for the deployed commit.

## Maintenance

- Keep the `CI Gate` job name stable. Renaming it also requires updating Vercel's required check.
- Keep push coverage for `main`; a commit without the required check cannot satisfy the production gate.
- Do not add path filters that skip the required workflow on production commits.
- If the workflow or Vercel settings change, verify both sides. Enabling automatic CI alone does not prevent a production release.

References: [Vercel Deployment Checks](https://vercel.com/docs/deployment-checks) and [GitHub workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).
