# Agent Guidance

Canonical shared guidance surface for agents working in this repository. Keep
generic guidance here so Claude, Codex, and Pi share one source.

## Where things live

- ExecPlan format and rules: `.agents/PLANS.md`. ExecPlans themselves are
  ephemeral working documents, gitignored under `.agents/execplans/`.
- Architecture decisions: `docs/adr/` (index in `docs/adr/README.md`).
- Procedures and runbooks: `docs/how-to/`.
- Published contracts: `docs/reference/`.
- Reusable skills: `.agents/skills/`.
- Tool adapters, runtime wiring only: `.pi/`, `.codex/`.

## Verify claims first

Before documenting ownership, runtime behavior, or repository interactions,
verify the claim from current source in this checkout. Read the actual caller and
callee files, not only docs. If docs disagree with source, update the docs to
match source and name the source files used as evidence.

## Verification

Choose verification based on the current source and the checks that already ran;
do not run a full build-and-test cycle by habit.

- Inspect the working tree, touched paths, and the current PR or CI result. A
  passing check for an older commit does not cover newer local changes.
- If the exact current commit has a successful `Workspace checks` run
  (`.github/workflows/ci.yml`) and no relevant files changed afterward, run the
  narrowest relevant checks instead of repeating the full cycle, and say the
  broader checks are covered by CI.
- Run the full cycle when checks are absent, queued, failed, or stale; when
  dependency, lock, build, workflow, routing, Sanity schema/query/typegen, or
  deployment-sensitive code changed; or when release-level verification is
  requested.
- In the final report, name the checks that ran and any intentionally skipped
  full-cycle checks.

## Skills

- `.agents/skills/samfunnetibergen-production-release/`: release the website to
  production through GitHub Actions, Vercel staging, smoke tests, and promotion.
- `.agents/skills/react-doctor/`: optional React health scan.

Add new skills under `.agents/skills/<name>/SKILL.md` with a clear
job-to-be-done and trigger terms. Do not duplicate guidance from this file or
from `docs/`.
