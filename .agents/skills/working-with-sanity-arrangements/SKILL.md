---
name: working-with-sanity-arrangements
description: Work on arrangement listing, detail pages, feeds, and event submission without confusing Sanity ownership with kvarteret-personal volunteer-prospect or mobile-card APIs.
---

# Working With Sanity Arrangements

Use this skill for `/arrangementer`, arrangement detail pages, iCal, JSON-LD
event feed, event submission, event taxonomy, rooms, and organizer group
references.

## Source Of Truth

- Sanity document types: `sanity/schemaTypes/documents/event.ts`,
  `sanity/schemaTypes/documents/eventType.ts`,
  `sanity/schemaTypes/documents/eventTaxonomyGroup.ts`, and
  `sanity/schemaTypes/documents/singletons.ts`.
- Sanity queries: `lib/sanity/queries/events.ts`.
- Server fetch helpers: `lib/sanity/fetch/events.ts`.
- Public pages: `app/[locale]/arrangementer/page.tsx` and
  `app/[locale]/arrangementer/[event]/page.tsx`.
- Feeds: `app/api/ical/route.ts` and `app/api/events/feed/route.ts`.
- Public event submission: `features/events/actions/submitEvent.ts`.

## Boundary Rules

- Do not document `kvarteret-personal` as the public arrangement source for this
  site unless the current source changes to call it.
- Do not import deploy-critical code from `lib/kvarteret-personal-api/` without
  first resolving the ignored generated-file boundary.
- Event submission creates Sanity `arrangement` documents and uses approval
  state before public display.

## Verification

Run `npm run sanity:typegen` after schema or query shape changes. Run
`npm run build` for route, metadata, or feed changes when feasible.
