# Repository Interactions

This document records current source-backed interactions for this repository.
Update it when a source-backed boundary changes.

## Arrangement Data

`samfunnetibergen` reads public arrangement data from Sanity.

Verified source:

- `studio/schemaTypes/documents/event.ts`
- `lib/sanity/queries/events.ts`
- `lib/sanity/fetch/events.ts`
- `app/[locale]/arrangementer/page.tsx`
- `app/[locale]/arrangementer/[event]/page.tsx`
- `app/api/ical/route.ts`
- `app/api/events/feed/route.ts`

Do not document `kvarteret-personal` as the public arrangement source for this
site unless these call paths change.

## Volunteer Prospects

The public volunteer form submits to this repo first. The route validates the
payload and proxies accepted submissions to `kvarteret-personal`.

Verified source:

- `features/blifrivillig/prospect.ts`
- `features/blifrivillig/components/GroupVolunteerForm.tsx`
- `app/api/volunteer-prospects/route.ts`

## Generated Personal Client

`package.json` contains `api:generate` and `api:sync` scripts for the
`kvarteret-personal` OpenAPI client, but `.gitignore` ignores
`lib/kvarteret-personal-api/`. Do not add deploy-critical imports from that
generated directory unless the generated-file boundary is deliberately changed.
