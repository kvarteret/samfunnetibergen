# Retire the named `neste` preview workflow in favor of reviewed pull-request previews

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This repository includes `.agents/PLANS.md`; this document must be maintained in accordance with it.

## Purpose / Big Picture

Contributors should be able to open a pull request, use the Vercel preview attached to that pull request, receive one lightweight review, and merge safely without learning a separate shared staging workflow at `neste.samfunnetibergen.no`. After this work, `develop` remains the default branch and the source for manual production releases, but the named `neste` branch domain is retired. Sanity Presentation uses `https://samfunnetibergen.no` instead of `neste`; a future move of the Studio application itself to `studio.samfunnetibergen.no` remains possible without restoring the old staging workflow.

The result is visible in three places: pull requests to `develop` cannot merge without one approval and the existing CI and Vercel checks; Sanity Presentation no longer contains or receives a `neste` origin; and `neste.samfunnetibergen.no` is no longer assigned to the Vercel `develop` preview or DNS.

## Progress

- [x] (2026-07-22 08:52Z) Verified the current GitHub, Vercel, Sanity Presentation, CI, and production-release boundaries.
- [x] (2026-07-22 08:52Z) Created branch `codex/remove-neste-workflow` and this ExecPlan.
- [x] (2026-07-22 08:55Z) Updated the Sanity Presentation origin and durable release documentation without adding a pull-request template or `CONTRIBUTING.md`.
- [x] (2026-07-22 08:55Z) Added classic GitHub branch protection for `develop`: pull request required, one approval, conversations resolved, existing CI and Vercel checks required, loose status checks, force pushes and deletion blocked, administrators able to bypass emergencies.
- [x] (2026-07-22 08:57Z) Passed focused Studio tests, touched-file formatting and ESLint, TypeScript, the full 443-test suite with coverage, `git diff --check`, and a production build.
- [ ] Commit the implementation, push the branch, and open a pull request.
- [ ] Verify the pull request gets CI and a Vercel preview and is blocked pending an external approval.
- [ ] Remove the branch-scoped Preview `NEXT_PUBLIC_SITE_URL` value that points at `neste` and verify Preview builds no longer depend on it.
- [ ] Remove the Vercel domain-to-`develop` mapping and current `neste` alias.
- [ ] Remove only the `neste` DNS record if the available credentials authorize the DNS provider; otherwise record the exact external action still required.
- [ ] Verify production and Studio behavior, update this plan, and record the outcome.

## Surprises & Discoveries

- Observation: `neste.samfunnetibergen.no` is a Vercel Preview deployment tied to `develop`, not a production alias.
  Evidence: `vercel inspect https://neste.samfunnetibergen.no` reported target `preview` and the generated alias `samfunnetibergen-git-develop-martin-kleivens-projects-aef67e0e.vercel.app`.

- Observation: GitHub currently has no branch protection and no repository rulesets for `develop`; the recent merged pull requests inspected before implementation had no approvals.
  Evidence: the branch-protection endpoint returned null requirements and the rulesets endpoint returned an empty list.

- Observation: retiring the domain is not only an external configuration operation.
  Evidence: `src/studio/presentation/routing.ts` hard-codes the `neste` origin, and the Vercel Preview environment scoped to `develop` sets `NEXT_PUBLIC_SITE_URL=https://neste.samfunnetibergen.no`.

- Observation: the Vercel CLI can inspect the deployment behind `neste`, but `vercel domains inspect` reports an access error even though the parent domain appears in `vercel domains ls`.
  Evidence: the deployment inspection succeeded for `dpl_E7yg6nHyfAgVMWnfksTBAvJ764GJ`, while direct domain inspection failed. Domain mapping removal may therefore require the Vercel project API or dashboard rather than the domain CLI.

- Observation: selecting one test through the repository's `npm test -- <file>` command executes the relevant tests successfully but fails the global coverage threshold because the rest of the repository is intentionally excluded.
  Evidence: 16 tests passed, then global line coverage was 8.47% against the 80% threshold. `npx vitest run src/studio/presentation/resolve.test.ts --coverage=false` passed and is the focused verification command; the full `npm test` remains the coverage acceptance command.

- Observation: the repository-wide Biome format check currently enters `.claude/worktrees/silly-haslett-8ff3a5` and fails on its nested root configuration.
  Evidence: `npm run lint` stopped before ESLint with “Found a nested root configuration.” Touched-file Biome formatting, touched-file ESLint, and TypeScript passed; the full check will also be exercised by GitHub CI, whose clean checkout does not include the local nested worktree.

## Decision Log

- Decision: Keep `develop` as the default branch and production release source.
  Rationale: the user asked to retire `neste` as a workflow, not to redesign branch ownership. `.github/workflows/release-production.yml` already stages, smoke-tests, and promotes an immutable production artifact from `develop`.
  Date/Author: 2026-07-22 / Codex and user.

- Decision: Do not create `.github/pull_request_template.md` or `CONTRIBUTING.md`.
  Rationale: the user explicitly removed both artifacts from scope to minimize ceremony.
  Date/Author: 2026-07-22 / user.

- Decision: Point Sanity Presentation at `https://samfunnetibergen.no` and remove the hard-coded `neste` origin.
  Rationale: the user explicitly chose the production site as the current Studio target and noted that the Studio application itself may later move to `studio.samfunnetibergen.no`.
  Date/Author: 2026-07-22 / user.

- Decision: Keep Vercel's generated per-PR and per-branch preview URLs available, but do not treat the generated `develop` URL as a mandatory named environment.
  Rationale: this preserves an escape hatch for rare integration checks while removing a concept new contributors otherwise need to learn.
  Date/Author: 2026-07-22 / Codex.

- Decision: Use classic branch protection instead of a repository ruleset for the `develop` guardrail.
  Rationale: the repository had neither mechanism, and classic protection directly supports the required review, loose status checks, conversation resolution, and administrator bypass without inventing repository-role identifiers for a ruleset bypass list.
  Date/Author: 2026-07-22 / Codex.

## Outcomes & Retrospective

Implementation is in progress. At completion, this section will state which repository, GitHub, Vercel, and DNS changes succeeded; identify any action blocked by external ownership; and record the final verification evidence.

## Context and Orientation

The working directory is `/Users/kluvin/dev/kvarteret/samfunnetibergen`. Vercel deploys each pull request and each branch push as a Preview deployment. A branch domain is a custom hostname that Vercel automatically moves to the newest deployment from one configured branch. Today `neste.samfunnetibergen.no` is the branch domain for `develop`.

The existing pull-request workflow is `.github/workflows/ci.yml`. It runs the check named `Lint, Format, Typecheck, Test` for pull requests targeting `develop` or `main`. The Vercel GitHub integration also reports a status named `Vercel`. The existing production workflow is `.github/workflows/release-production.yml`; it manually checks out a requested ref (normally `develop`), runs repository checks, builds a production artifact, deploys it without assigning the production domain, smoke-tests it, and promotes that same artifact.

Sanity Presentation routing is configured in `src/studio/presentation/routing.ts`. `resolvePresentationInitialUrl()` currently prefers `SANITY_STUDIO_PREVIEW_URL`, then `NEXT_PUBLIC_SITE_URL`, then localhost. `resolvePresentationOrigins()` currently includes localhost, those two environment values, the production site, and a hard-coded `neste` origin. The intended result is for production to be the default non-local target and for no source code to mention `neste`.

`src/lib/site-url.ts` supplies metadata, sitemap, robots, feed, and structured-data URLs. Its fallback order is `SITE_URL`, `NEXT_PUBLIC_SITE_URL`, `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL`, then localhost. Removing the branch-scoped Preview `NEXT_PUBLIC_SITE_URL` therefore makes Preview deployments prefer Vercel's configured production URL for canonical public metadata instead of claiming the retired staging hostname.

## Plan of Work

First, update `src/studio/presentation/routing.ts` so `resolvePresentationInitialUrl()` falls back to `https://samfunnetibergen.no` instead of localhost for a production build with no preview override, while retaining localhost for local development where appropriate. Remove the hard-coded `neste` origin from `resolvePresentationOrigins()`. Update or add focused tests in `src/studio/presentation/resolve.test.ts` so the chosen production target and origin set are observable and regression-protected. Update `docs/how-to/release-production.md` only where needed to state that reviewed pull requests merge to `develop` and PR-specific Vercel URLs are the normal review surface. Do not add onboarding templates.

Second, create a GitHub rule for `develop`. Prefer a repository ruleset if the installed GitHub plan and permissions support it; otherwise use classic branch protection with the same behavior. Require a pull request with one approval, conversation resolution, the `Lint, Format, Typecheck, Test` and `Vercel` statuses, and block deletion and force pushes. Do not require branches to be current with `develop`, do not dismiss approvals after every push, and do not enforce the rule on administrators so an emergency bypass remains possible.

Third, run focused tests for the Studio resolver, then the repository lint command and TypeScript check. Run the production build because `NEXT_PUBLIC_SITE_URL` affects build-time metadata and Studio output. Commit the ExecPlan and implementation together, push `codex/remove-neste-workflow`, and open a pull request to `develop`. Confirm GitHub reports both required checks and that the new rule blocks merging until somebody other than the author approves. Do not merge without that approval.

Fourth, remove the Vercel Preview environment variable scoped to branch `develop` named `NEXT_PUBLIC_SITE_URL`; its current value is the retiring hostname. Trigger or use the pull-request preview to verify metadata and Studio routing no longer depend on `neste`. Keep `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` absent from Preview so staging visits remain outside production analytics.

Fifth, after the replacement PR workflow is demonstrably working, edit the Vercel project domain configuration to disconnect `neste.samfunnetibergen.no` from Preview branch `develop`, then remove any remaining alias. Removing only the current alias is insufficient because a retained branch-domain mapping would recreate it on the next `develop` push.

Finally, remove only the `neste` DNS record at the authoritative DNS provider. Preserve the apex, `www`, and `studio` records. If the current credentials cannot access DNS, stop at this single external boundary and provide the exact hostname and record that an authorized operator must remove. Verify production, Studio, PR previews, and the release source after the external change.

## Concrete Steps

Run repository commands from `/Users/kluvin/dev/kvarteret/samfunnetibergen`.

Inspect and edit the relevant source:

    rg -n "neste\.samfunnetibergen|NEXT_PUBLIC_SITE_URL|SANITY_STUDIO_PREVIEW_URL" src docs .agents .github

Run focused and broad verification:

    npm test -- src/studio/presentation/resolve.test.ts
    npm run lint
    npx tsc --noEmit
    POSTHOG_CLI_API_KEY= POSTHOG_CLI_PROJECT_ID= npm run build

Inspect the GitHub rule and pull request after publishing:

    gh api repos/kvarteret/samfunnetibergen/rulesets
    gh pr checks <number>
    gh pr view <number> --json reviewDecision,mergeStateStatus,statusCheckRollup,url

Inspect Vercel after removing the branch mapping:

    vercel inspect https://neste.samfunnetibergen.no
    vercel inspect https://samfunnetibergen.no

The first command should eventually fail to resolve a current deployment or show that the alias is absent. The second must continue to report a Ready production deployment.

## Validation and Acceptance

The repository change is accepted when the Studio routing tests pass, `rg` finds no active source or durable documentation dependency on `neste`, lint and TypeScript pass, and a production build completes.

The GitHub change is accepted when a pull request to `develop` receives both required statuses, cannot merge without one external approval, and can merge after one approval without requiring a branch-update rebuild.

The Vercel change is accepted when pull requests still receive unique Preview deployments, `develop` still receives a generated Vercel Preview URL, and no future `develop` deployment is assigned `neste.samfunnetibergen.no`.

The external retirement is complete when DNS no longer routes `neste.samfunnetibergen.no`, `https://samfunnetibergen.no/nb` remains healthy, Sanity Presentation targets production, and the production release workflow remains sourced from `develop`.

## Idempotence and Recovery

Source edits, tests, and read-only inspections are repeatable. GitHub rule creation must first list existing rules so a retry updates the same rule instead of creating duplicates. Vercel environment removal must first verify the exact branch-scoped target. Domain removal must resolve the exact branch mapping before changing it, and DNS removal must target only the `neste` record.

Rollback consists of re-adding `neste.samfunnetibergen.no` to the Vercel project, assigning it to Preview branch `develop`, restoring its DNS record, and restoring the branch-scoped `NEXT_PUBLIC_SITE_URL`. The GitHub pull-request protection should remain because it is valuable independently of the domain decision.

## Artifacts and Notes

Current external evidence before mutation:

    neste target: preview
    neste branch alias: samfunnetibergen-git-develop-martin-kleivens-projects-aef67e0e.vercel.app
    develop branch protection: none
    repository rulesets: none
    Preview(develop) NEXT_PUBLIC_SITE_URL: https://neste.samfunnetibergen.no

## Interfaces and Dependencies

No new runtime library is required. The work uses the existing Next.js environment variables, the existing GitHub Actions checks, the Vercel Git integration, the GitHub repository rules API, and the DNS provider that owns `samfunnetibergen.no`.

`resolvePresentationInitialUrl(): string` and `resolvePresentationOrigins(): string[]` in `src/studio/presentation/routing.ts` remain the source interfaces for Studio navigation. The production release interface remains the `workflow_dispatch` inputs in `.github/workflows/release-production.yml`.

Revision note (2026-07-22): Initial plan created after the user removed the PR-template and contributor-guide work from scope and selected `samfunnetibergen.no` as the current Sanity Presentation target.

Revision note (2026-07-22 08:55Z): Recorded the completed source and GitHub-protection milestones plus local verification discoveries.

Revision note (2026-07-22 08:57Z): Recorded successful repository verification and split publishing into its own remaining progress item.
