# Agent Guidance

This directory is the canonical instruction surface for agents working in this
repo. Keep generic guidance here so Claude, Codex, and Pi can share it.

## Verify Claims First

Before documenting ownership, runtime behavior, or repo interactions, verify the
claim from source in the current checkout. Do not rely on older docs if source
and docs disagree.

Current verified boundaries:

- Public arrangement pages and feeds read from Sanity through
  `lib/sanity/fetch/events.ts`, `lib/sanity/queries/events.ts`,
  `app/[locale]/arrangementer/page.tsx`, `app/[locale]/arrangementer/[event]/page.tsx`,
  `app/api/ical/route.ts`, and `app/api/events/feed/route.ts`.
- Public volunteer prospect submissions are validated locally, then proxied to
  `kvarteret-personal` from `app/api/volunteer-prospects/route.ts`.
- Generated `kvarteret-personal` client files live under
  `lib/kvarteret-personal-api/`, but that path is ignored by `.gitignore`; do
  not introduce deploy-critical imports from it unless the generated files are
  intentionally committed or the deployment path is otherwise verified.

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
