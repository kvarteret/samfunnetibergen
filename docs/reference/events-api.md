# Public events API

The public events API gives external applications a stable, read-only view of
approved Samfunnet arrangements. It is served by the website at
`/api/v1/events` and is backed directly by the published Sanity content. The
API is intended for calendar and application integrations; callers must not
scrape the website or query Sanity directly.

## Occurrences

The collection is occurrence-first. An occurrence is one concrete date entry
that a calendar can display. A multi-date single event therefore appears once
per date, while a materialized series instance or festival session normally
appears once. Occurrence `id` values and event `id` values are opaque: store and
compare the complete string, but do not parse its parts.

Each occurrence has a stored local `startDate`, optional local `startTime` and
`endTime`, the `Europe/Oslo` IANA time zone, and normalized `startsAt` and
`endsAt` timestamps when the relevant times are known. Date-only entries are
not declared to be all-day events. When an end time is earlier than its start
time, `endDate` is the following calendar date, so an overnight event remains
chronologically correct.

## Collection

`GET /api/v1/events` returns every public occurrence from today in Oslo
onward. The default response is unpaginated. Use `locale=nb` or `locale=en`;
Norwegian is the default and is used field-by-field when an English value is
missing.

Supplying either inclusive `from` or `to` changes the response to fixed pages
of 100 occurrences. An omitted `from` uses today in Oslo, and an omitted `to`
has no upper bound. The response's `links.next` contains an opaque cursor URL
when another page exists. Follow that URL unchanged. A cursor is bound to its
locale and date range, so changing those parameters returns `400`.

The `data` items contain a compact event summary: title, event kind, effective
status, image, event type and taxonomy, organizer, location, parent summary,
and API/website links. Full descriptions, price variants, ticket links, and
Facebook links are available from the detail resource.

Example default request:

    curl -i 'https://www.samfunnetibergen.no/api/v1/events?locale=nb'

Example bounded request:

    curl -i 'https://www.samfunnetibergen.no/api/v1/events?locale=en&from=2026-09-01&to=2027-02-28'

## Detail

`GET /api/v1/events/{slug}?locale=nb` returns the complete public event record,
including rich Portable Text blocks and plain text, image caption, taxonomy,
organizer, location, pricing in NOK, public links, effective status, and
ordered occurrences. Approved historical events remain reachable by slug.

A series or festival parent returns its approved child program. A child
occurrence includes a parent summary so clients can navigate back to that
overview. Internal arrangements and unapproved records are not returned by
the documented API.

Example detail request:

    curl -i 'https://www.samfunnetibergen.no/api/v1/events/example-slug?locale=nb'

## Errors and caching

Errors use one envelope with `code` and a stable human-readable `message`:

    {
      "error": {
        "code": "invalid_request",
        "message": "from must not be later than to for an inclusive date range."
      }
    }

Invalid query parameters return `400`; a missing or hidden detail returns
`404`; an unexpected temporary failure returns `500`. Successful and error
responses are JSON and permit anonymous cross-origin reads. Responses use a
60-second shared cache with stale-while-revalidate for five minutes. Clients
should use the `links` values for navigation and should tolerate additive
optional fields in v1. Breaking contract changes will use `/api/v2`.

The API is separate from the optional Schema.org linked-data export at
`/api/events/feed`. That route is a lossy `DataFeed` representation, while v1
is the complete application contract. Event JSON-LD remains embedded on
individual website detail pages for search metadata. No calendar-subscription
or iCalendar endpoint is currently provided.
