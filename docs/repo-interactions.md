# Repository Interactions

This document records current source-backed interactions for this repository.
Update it when a source-backed boundary changes.

## Arrangement Data

`samfunnetibergen` reads public arrangement data from Sanity.

Verified source:

- `apps/studio/src/studio/schemaTypes/documents/arrangement.ts`
- `apps/web/src/lib/sanity/queries/events.ts`
- `apps/web/src/lib/sanity/fetch/events.ts`
- `apps/web/src/app/[locale]/arrangementer/page.tsx`
- `apps/web/src/app/[locale]/arrangementer/[event]/page.tsx`
- `apps/web/src/app/api/ical/route.ts`
- `apps/web/src/app/api/events/feed/route.ts`

Do not document `kvarteret-personal` as the public arrangement source for this
site unless these call paths change.

## Volunteer Prospects

The public volunteer form submits to this repo first. The route validates the
payload and proxies accepted submissions to `kvarteret-personal`. Every
published group can use the form. Sanity group slugs are forwarded unchanged;
Personal owns the stable group-slug lookup and resolves them to its group IDs.
Both repositories use the same deterministic slug rule without aliases. In
Studio, an existing group slug is hidden and read-only; it is only generated
while creating a new group.

Verified source:

- `apps/web/src/features/grupper/components/GroupVolunteerForm.tsx`
- `apps/web/src/app/[locale]/grupper/[slug]/page.tsx`
- `apps/web/src/app/api/volunteer-prospects/route.ts`

## Generated Personal Client

The generated `kvarteret-personal` OpenAPI client directory is ignored by
`.gitignore` at `apps/web/src/lib/integrations/kvarteret-personal-api/`. Do not
add deploy-critical imports from that generated directory unless the
generated-file boundary is deliberately changed.
