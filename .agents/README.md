# Agent Guidance

This directory is the canonical instruction surface for agents working in this
repo. Keep generic guidance here so Claude, Codex, and Pi can share it.

## Verify Claims First

Before documenting ownership, runtime behavior, or repo interactions, verify the
claim from source in the current checkout. Do not rely on older docs if source
and docs disagree.

Current verified boundaries:

- Public arrangement pages and feeds read from Sanity through
  `src/lib/sanity/fetch/events.ts`, `src/lib/sanity/queries/events.ts`,
  `src/app/[locale]/arrangementer/page.tsx`,
  `src/app/[locale]/arrangementer/[event]/page.tsx`,
  `src/app/api/ical/route.ts`, and `src/app/api/events/feed/route.ts`.
- Public volunteer prospect submissions are validated locally, then proxied to
  `kvarteret-personal` from `src/app/api/volunteer-prospects/route.ts`.
- Generated `kvarteret-personal` client files live under
  `src/lib/integrations/kvarteret-personal-api/`, but that path is ignored by
  `.gitignore`; do not introduce deploy-critical imports from it unless the
  generated files are intentionally committed or the deployment path is
  otherwise verified.

## Verification and Full-Cycle Checks

Choose verification based on the current source and the checks that already
ran; do not run a full build-and-test cycle by habit.

- First inspect the working tree, touched paths, and the current PR or CI
  check result. A passing check for an older commit does not cover newer local
  changes.
- If the exact current commit has a successful `Workspace checks` run and no
  relevant files changed afterward, do not repeat the full test and production
  build cycle locally solely for confirmation. Run the narrowest relevant
  checks instead, and report that the broader checks are covered by CI.
- Run the full cycle when checks are absent, queued, failed, or stale; when
  dependency or lock files, build configuration, workflows, routing, Sanity
  schema/query/type generation, or deployment-sensitive code changed; or when
  the user explicitly requests release-level verification.
- For focused web changes, prefer the commands and source-specific checks in
  `verifying-web-changes`. Include `npm run sanity:typegen` for schema/query
  changes and review generated type drift.
- Production release workflows may retain their own validation because they
  release the merged `develop` commit into production. Do not remove release
  gates merely because a PR check passed unless the merge/release process
  proves that the exact release source was validated.
- In the final report, name the checks that ran, identify checks supplied by
  CI, and explain any intentionally skipped full-cycle checks.

## Skills

- `documenting-repo-interactions`: verify and document source-backed repo
  boundaries.
- `security-audit`: perform calibrated security reviews with concrete data flow.
- `verifying-web-changes`: choose the narrowest source, build, and runtime
  checks for this Next.js/Sanity app.
- `working-with-sanity-arrangements`: work on arrangement pages, feeds, and
  submission flow without confusing Sanity and `kvarteret-personal` ownership.
- `sanity-typegen-types`: regenerate and consume Sanity types correctly,
  keeping required fields nullable and parsing at the fetch boundary.
- `react-doctor`: optional React health scan copied from the generic PostHog
  skill.
- `writing-skills`: add or update focused agent skills in this directory.

## Tool Adapters

- `.pi/README.md` is only a Pi adapter. Keep generic Pi guidance here instead.
- `.claude/` may contain Claude-specific settings, launch config, or imported
  third-party skills. Do not duplicate generic rules there.
