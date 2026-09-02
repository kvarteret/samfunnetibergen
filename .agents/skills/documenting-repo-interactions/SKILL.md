---
name: documenting-repo-interactions
description: Verify and document repository interactions from current source. Use when adding or changing docs about ownership, API boundaries, generated clients, Sanity content, external systems, deployment tracks, or sibling repositories.
---

# Documenting Repo Interactions

Every interaction claim must be verified before it is written.

## Workflow

1. Search current source for the route, environment variable, generated client,
   schema type, or external host named in the claim.
2. Read the actual caller and callee files, not only docs.
3. If docs disagree with source, update the docs to match source and mention the
   source files in the change summary.
4. Keep durable facts in project docs. Keep temporary investigation notes out of
   durable docs unless they describe a current boundary.

## Current Verified Boundaries

- Arrangement pages, the versioned API, and the linked-data feed read from
  Sanity through `features/events/server/public-events.ts`, backed by
  `lib/sanity/queries/events.ts`. Public consumers include
  `app/[locale]/arrangementer/page.tsx`,
  `app/[locale]/arrangementer/[event]/page.tsx`, `app/api/v1/events/`, and
  `app/api/events/feed/route.ts`. There is no iCalendar route in current source.
- Volunteer prospect submissions are proxied to `kvarteret-personal`:
  `app/api/volunteer-prospects/route.ts`.
- The generated `kvarteret-personal` client directory is ignored:
  `.gitignore` and `lib/kvarteret-personal-api/`.

## Output Standard

When documenting an interaction, include:

- owner repo or system
- consumer repo or system
- source file paths used as evidence
- runtime or deploy caveat if source and generated artifacts can diverge
