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

Schedules retain local date/time values, identify `Europe/Oslo`, and include UTC
`startsAt` and `endsAt` values when their times are known. Overnight events end
on the following date. A selected room is returned as a room location and an
explicit free-text location is returned unchanged. If neither is present, the
public location is the venue itself: `Det Akademiske Kvarter`.

## Collection

`GET /api/v1/events` returns every public occurrence from today in Oslo onward.
This default response is an unpaginated integration snapshot suitable for
Broadcast and the mobile app. Use `locale=nb` or `locale=en`; Norwegian is the
default and is the field-by-field fallback for missing English content.

Each occurrence contains a compact but integration-complete event summary:
stable identity, title, kind, status, effective modification timestamp, image,
event type and taxonomy, organizer, location, pricing, ticket link, parent
summary, and API/website links. Broadcast can map a collection item without
following its detail link.

Supplying either inclusive `from` or `to` uses fixed pages of 100 occurrences.
An omitted `from` means today in Oslo and an omitted `to` has no upper bound.
Follow `links.next` unchanged. A cursor is bound to its locale and date range;
changing those parameters returns `400`.

Examples:

    curl -i 'https://www.samfunnetibergen.no/api/v1/events?locale=nb'

    curl -i 'https://www.samfunnetibergen.no/api/v1/events?locale=en&from=2026-09-01&to=2027-02-28'

The generated OpenAPI document is available at
`https://www.samfunnetibergen.no/api/v1/openapi.json`.

## Detail

`GET /api/v1/events/{slug}?locale=nb` returns one complete event record. Detail
adds rich Portable Text and plain-text descriptions, Facebook link, and ordered
occurrences. A series or festival parent also returns its
approved child program; a child summary links back to its parent. Approved
historical events remain reachable by slug.

The API intentionally has no batch-detail endpoint. Consumers use the
collection for multiple compact records and follow a detail link only when rich
content is needed.

## Broadcast mapping

Broadcast polls the default collection snapshot. The occurrence `id` is its
stable match key; ticket URLs are purchase metadata and may be shared by
multiple performances. Locally controlled readiness requires a title, concrete
start and end timestamps, image, taxonomy keyword, and ticket URL for a paid
event. A missing room and missing free-text location resolves to Det Akademiske
Kvarter and is therefore not an incomplete venue.

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
stale-while-revalidate; errors are not cached.

Clients must tolerate additive optional fields within v1 and use returned links
for navigation. Breaking changes require `/api/v2`. The Vercel project must
allow anonymous access to `/api/v1/*`; deployment bypass headers are not part of
the public contract.

Schema.org Event JSON-LD remains embedded on individual website detail pages
for search metadata. There is no standalone Schema.org DataFeed and no
iCalendar endpoint.
