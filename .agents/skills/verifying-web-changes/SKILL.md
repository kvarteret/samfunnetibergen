---
name: verifying-web-changes
description: Choose and run the narrowest useful verification for samfunnetibergen web, Sanity, route, and API changes.
---

# Verifying Web Changes

Use source-specific verification instead of broad noisy sweeps.

## Commands

- Website build: `npm run build:web`
- Studio build: `npm run build:studio`
- Lint: `npm run lint`
- Sanity TypeGen after schema/query changes: `npm run sanity:typegen`
- Generated personal client sync only when intentionally using that client:
  `npm run api:sync`

## Source-Specific Checks

- Arrangement pages and feeds: inspect Sanity queries in
  `apps/web/src/lib/sanity/queries/events.ts`, then verify the affected route
  under `apps/web/src/app/[locale]/arrangementer/`,
  `apps/web/src/app/api/v1/events/`, or
  `apps/web/src/app/api/events/feed/route.ts`.
- Volunteer prospect flow: verify `features/blifrivillig/prospect.ts`,
  `features/blifrivillig/components/GroupVolunteerForm.tsx`, and
  `app/api/volunteer-prospects/route.ts`.
- Schema changes: run `npm run sanity:typegen` and review generated type drift.
- Deploy-sensitive imports: check `.gitignore` before relying on generated
  files or local-only artifacts.

## Report

State which checks ran and which source files prove the behavior. If a broad
check fails from unrelated baseline noise, isolate the touched path before
calling the task blocked.
