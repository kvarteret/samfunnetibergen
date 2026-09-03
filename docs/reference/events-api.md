# Public events API

The public events API gives applications and external integrations one stable,
read-only view of approved Samfunnet arrangements. It is served by the website,
backed by published Sanity content, and is the supported source for both the
mobile app and the planned Broadcast integration. Callers must not scrape the
website or query Sanity directly.

## Occurrences and locations

The collection is occurrence-first: every item is one concrete date a calendar
can display. A multi-date event appears once per date. Event and occurrence IDs
are opaque and must be stored whole rather than parsed.

Schedules are a discriminated union. A timed schedule is
`{kind:"timed", startsAt, endsAt, timeZone}`, where timestamps are UTC ISO 8601
values and `endsAt` is nullable when the end is unknown. A date-only schedule is
`{kind:"date", date, timeZone}`. Both identify `Europe/Oslo`; overnight events
end on the following local date. A selected room is returned as a room location
and an explicit free-text location is returned unchanged. If neither is
present, the public location is the venue itself: `Det Akademiske Kvarter`.

## Collection

`GET /api/v1/events` returns every public occurrence from today in Oslo onward.
This response is a complete integration snapshot suitable for Broadcast and the
mobile app. Use `locale=nb` or `locale=en`; Norwegian is the default and is the
field-by-field fallback for missing English content. Supplying `from` and/or
`to` applies inclusive local date filters, but does not paginate the result.

Each occurrence contains a compact but integration-complete event summary:
stable identity, title, kind, status, effective modification timestamp, image,
event type and taxonomy, organizer, location, pricing, ticket link, parent
summary, a sanitized `{html,text}` description, and API/website/ticket links.
Broadcast can map a collection item without following its detail link. The
response metadata contains `locale`, the effective `from` date, the optional
`to` date, and `count`; there is no page or next-link metadata. Unknown query
parameters, including `limit`, return `400`.

Examples:

    curl -i 'https://www.samfunnetibergen.no/api/v1/events?locale=nb'

    curl -i 'https://www.samfunnetibergen.no/api/v1/events?locale=en&from=2026-09-01&to=2027-02-28'

The generated OpenAPI document is available at
`https://www.samfunnetibergen.no/api/v1/openapi.json`.

## Detail

`GET /api/v1/events/{slug}?locale=nb` returns one complete event record. The
description is available as sanitized HTML and plain text, and the canonical
Facebook link is inside `data.links`. Leaf details have `detailKind:"leaf"` and
their `occurrences` contain only `{id,schedule}`. Parent details have
`detailKind:"parent"` and their occurrences contain `{id,schedule,event}` child
summaries; child summaries do not repeat the parent record. Approved historical
events remain reachable by slug.

The API intentionally has no batch-detail endpoint. Consumers use the
collection for multiple compact records and follow a detail link only when rich
content is needed.

## Broadcast mapping

Broadcast polls the default collection snapshot. The occurrence `id` is its
stable match key; ticket URLs are optional purchase metadata, may be absent,
and may be shared by multiple performances. A missing ticket URL is reported
as information and does not block readiness. Locally controlled readiness
requires a title, concrete start and end timestamps, image, and taxonomy
keyword. A missing room and missing free-text location resolves to Det
Akademiske Kvarter and is therefore not an incomplete venue.

Editors may use 23:00 as the estimated end time for an evening concert when no
more precise end time is available. This is an explicit content decision, not
an API-generated default: the API continues to return `null` rather than invent
an end time for other events.

Broadcast must still confirm its venue ID, room mapping, accepted tag
vocabulary, polling cadence, cancellation mapping, and the meaning of an item
disappearing from a later full snapshot. Run the non-mutating audit before
handoff:

    npm --workspace @samfunnet/web run events:audit:broadcast -- --report-only

## Errors, caching, and deployment

Errors use an envelope containing `code` and `message`. Invalid query parameters
return `400`, missing or hidden details return `404`, and temporary failures
return `500`. Anonymous cross-origin `GET`, `HEAD`, and `OPTIONS` are supported.
Successful responses use a 60-second shared cache with five minutes of
stale-while-revalidate and include an `ETag`; a matching `If-None-Match` returns
`304` without a body. `HEAD` has the same status and headers as `GET` without a
body. Errors are not cached.

Clients must tolerate additive optional fields within v1 and use returned links
for navigation. Breaking changes require `/api/v2`. The Vercel project must
allow anonymous access to `/api/v1/*`. The project-level `Allow Public Events
API` firewall rule provides that path-scoped bypass; deployment bypass headers
are not part of the public contract.

Schema.org Event JSON-LD remains embedded on individual website detail pages
for search metadata. There is no standalone Schema.org DataFeed and no
iCalendar endpoint.
