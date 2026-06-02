# Repository Interactions

This document records current source-backed interactions for this repository.
Update it when a source-backed boundary changes.

## Arrangement Data

`samfunnetibergen` reads public arrangement data from Sanity.

Verified source:

- `src/studio/schemaTypes/documents/event.ts`
- `src/lib/sanity/queries/events.ts`
- `src/lib/sanity/fetch/events.ts`
- `src/app/[locale]/arrangementer/page.tsx`
- `src/app/[locale]/arrangementer/[event]/page.tsx`
- `src/app/api/ical/route.ts`
- `src/app/api/events/feed/route.ts`

Do not document `kvarteret-personal` as the public arrangement source for this
site unless these call paths change.

## Volunteer Prospects

The public volunteer form submits to this repo first. The route validates the
payload and proxies accepted submissions to `kvarteret-personal`.

Verified source:

- `src/features/blifrivillig/prospect.ts`
- `src/features/blifrivillig/components/GroupVolunteerForm.tsx`
- `src/app/api/volunteer-prospects/route.ts`

## Generated Personal Client

`package.json` contains `api:generate` and `api:sync` scripts for the
`kvarteret-personal` OpenAPI client, but `.gitignore` ignores
`src/lib/integrations/kvarteret-personal-api/`. Do not add deploy-critical
imports from that generated directory unless the generated-file boundary is
deliberately changed.
