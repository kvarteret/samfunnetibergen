# CI and Vercel build cost

On 5 October 2026, [production run 37321341883](https://github.com/kvarteret/samfunnetibergen/actions/runs/37321341883)
completed in 3m23s. Dependency installation took 58s despite an npm download
cache hit; tests took 35s; Vercel CLI installation took 11s; the production
artifact build took 39s; prebuilt upload/deployment took 23s. Studio tests
accounted for about 12s of the test step. The build's additional npm install
took only 2s.

The production artifact is compiled on GitHub, then uploaded with
`vercel deploy --prebuilt`. Vercel still processes and deploys that output;
prebuilt deployment should not be described as zero Vercel usage. Faster
GitHub checks primarily reduce GitHub runner time and release latency.

Live deployment history showed Studio building eight recent website commits,
including `codex/infoskjerm` and `develop` merges. On 5 October, native
`enableAffectedProjectsDeployments` was enabled for the `samfunnetibergen` and
`studio` Vercel projects. Keep **Skip unaffected projects** enabled in both
projects' Git settings. The repository's ignored-build command adds filtering
for unrelated root files. It compares against `VERCEL_GIT_PREVIOUS_SHA`, the
last successful deployment, and builds if history is missing. This preserves
changes from earlier commits that have not deployed yet.

The current workflows use pnpm 10.34.6 with a cached package store and frozen
lockfile installs; pull request build jobs install affected app workspaces and
root tooling. The full checks job still checks both apps. Superseded pull
request workflows are cancelled. Production website builds restore their own
Next.js compilation cache; release typechecks restore incremental TypeScript
data. Release checks, tests, smoke tests, and promotion remain in place.
Each release also caches its pinned Vercel CLI by version, OS, architecture,
and Node major; a warm cache skips the CLI's separate installation.

Git builds on `develop` and `main` are disabled for both apps; production is
released by the two GitHub workflows. Feature branch previews remain enabled.
These rules are in `apps/web/vercel.json` and `apps/studio/vercel.json`.

## Measuring savings

Compare several hosted runs after caches warm, with and without a lockfile
change. Check install, compilation, and total job times separately. Count
Studio deployments for website-only commits and inspect Vercel's Build CPU
Minutes and On-Demand Concurrent Builds usage. An ignored build may still
consume deployment/concurrency capacity; native affected-project skipping
avoids creating that work earlier. See [Vercel's monorepo guidance](https://vercel.com/docs/monorepos)
and [build billing documentation](https://vercel.com/docs/builds/managing-builds).
No measured percentage or dollar savings are established by local validation.

## Other bill drivers

On 5 October, the four other accounts were converted to `VIEWER_FOR_PLUS`,
retaining `itleder-8901` as owner. Membership read-back confirmed those roles,
and subscription metadata now reports zero additional paid seats, down from
four at $20 each. This removes the $80/month additional-seat rate; accrued
charges and prorations can still appear on the current invoice.

September usage reported $22.91 of website Build CPU Minutes and $15.23 for
Studio, before credits. October 1–5 website and Studio resource usage totaled
about $1.30 before credits. These periods have different traffic and release
volume and should not be treated as a controlled savings comparison.

Both projects used Standard machines with elastic selection and on-demand
concurrency enabled. Check actual concurrency charges before choosing a
queueing limit; reducing concurrency can slow previews. No machine or
concurrency settings were changed.

The supplied website build lists nearly all public pages as dynamic. If
function usage dominates the invoice, investigate page caching while
preserving Sanity live editing and draft previews. If image/transfer usage
dominates, inspect image transformation counts and sizes and the `/ingest`
PostHog proxy traffic. These require usage evidence and separate application
changes; CI timing cannot establish their cost contribution.

Implementation evidence: `.github/workflows/ci.yml`,
`.github/workflows/release-production.yml`,
`.github/workflows/release-studio-production.yml`,
`scripts/vercel-ignore-build.sh`, both app `vercel.json` files, and
`apps/web/next.config.ts`.

## pnpm migration

The workspace pins pnpm 10.34.6, which is within [Vercel's documented supported
versions](https://vercel.com/docs/package-managers). `pnpm-lock.yaml` was
imported from the npm lockfile. Workspace references use `workspace:*` and
security overrides are retained under `pnpm.overrides` in the root manifest.
Studio now declares `@sanity/ui` 4.2.1 directly because its source imports that
package; npm had made the transitive dependency available implicitly.

`pnpm-workspace.yaml` explicitly approves versioned dependency install scripts
and enables `strictDepBuilds`. This replaces the old npm `allowScripts`
convention and its drift checker with enforcement during installation. Vercel
install and build commands use `corepack pnpm` to honor the packageManager pin.
GitHub installs pnpm before setup-node restores the package store cache.

A clean reinstall from warmed stores on the same Mac took 11.44s for pnpm
versus 20.44s for npm. pnpm's first install into an empty store took 56.3s.
The warm measurements ran concurrently and are indicative, not a hosted CI
benchmark. Check GitHub timing after the new pnpm store cache warms.

The complete migrated workspace passed format, lint, route type generation,
Sanity type generation without drift, TypeScript, all 620 tests, and both
production builds. The website build also completed its PostHog source-map
upload. Filtering tests, shell syntax, and actionlint passed. Clean filtered
installs and builds were verified separately for each app.
From the warm store, the clean website-only install selected 1,223 packages in
6.5s and Studio-only selected 926 packages in 3.7s on this Mac.
