---
name: working-with-sanity-arrangements
description: Work on arrangement listing, detail pages, feeds, and event submission without confusing Sanity ownership with kvarteret-personal volunteer-prospect or mobile-card APIs.
---

# Working With Sanity Arrangements

Use this skill for `/arrangementer`, arrangement detail pages, iCal, JSON-LD
event feed, event submission, event taxonomy, rooms, and organizer group
references.

## Source Of Truth

- Sanity document types: `apps/studio/src/studio/schemaTypes/documents/arrangement.ts`,
  `apps/studio/src/studio/schemaTypes/documents/eventType.ts`,
  `apps/studio/src/studio/schemaTypes/documents/eventTaxonomyGroup.ts`, and
  `apps/studio/src/studio/schemaTypes/documents/singletons/`.
- Sanity queries: `apps/web/src/lib/sanity/queries/events.ts`.
- Server fetch helpers: `apps/web/src/lib/sanity/fetch/events.ts`.
- Public pages: `apps/web/src/app/[locale]/arrangementer/page.tsx` and
  `apps/web/src/app/[locale]/arrangementer/[event]/page.tsx`.
- Feeds: `apps/web/src/app/api/ical/route.ts` and
  `apps/web/src/app/api/events/feed/route.ts`.
- Public event submission: `apps/web/src/features/events/actions/submitEvent.ts`.

## Boundary Rules

- Do not document `kvarteret-personal` as the public arrangement source for this
  site unless the current source changes to call it.
- Do not import deploy-critical code from
  `apps/web/src/lib/kvarteret-personal-api/` without
  first resolving the ignored generated-file boundary.
- Event submission creates Sanity `arrangement` documents and uses approval
  state before public display.

## Verification

Run `npm run sanity:typegen` after schema or query shape changes. Run
`npm run build:web` for route, metadata, or feed changes when feasible.
