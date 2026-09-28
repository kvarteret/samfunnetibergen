# Events API

The versioned events API is the website’s anonymous, read-only integration
boundary for approved arrangements. It reads published Sanity content through
the shared event service and applies localization, inherited fields, status,
visibility, and Europe/Oslo schedule rules before returning JSON. Clients must
use this API rather than querying Sanity or scraping website pages.

## Event occurrences

`GET /api/v1/events` returns every matching public occurrence. The default
range starts today in Europe/Oslo and has no upper bound. `locale=nb` (the
default) or `locale=en` selects the response language, with Norwegian as the
field-level fallback. Optional `from` and `to` values are inclusive local
calendar dates. Unknown query parameters return `400`.

The response is a complete snapshot:

    {
      "data": [
        {
          "id": "occurrence:event-1:date-1",
          "schedule": {
            "kind": "timed",
            "startsAt": "2026-09-10T16:00:00.000Z",
            "endsAt": "2026-09-10T18:00:00.000Z",
            "timeZone": "Europe/Oslo"
          },
          "event": {
            "id": "event-1",
            "slug": "event-1",
            "kind": "single",
            "status": "scheduled",
            "updatedAt": "2026-09-01T10:00:00.000Z",
            "title": "Example event",
            "description": { "html": "<p>Details</p>", "text": "Details" },
            "image": null,
            "eventType": null,
            "taxonomyGroup": null,
            "organizer": null,
            "location": { "kind": "venue", "name": "Det Akademiske Kvarter" },
            "pricing": {
              "currency": "NOK",
              "isFree": true,
              "ordinary": null,
              "student": null,
              "member": null
            },
            "parent": null,
            "links": {
              "website": "https://www.samfunnetibergen.no/nb/arrangementer/event-1",
              "ticket": null,
              "facebook": null
            }
          }
        }
      ],
      "meta": { "locale": "nb", "from": "2026-09-10", "to": null }
    }

Each stored date is one occurrence, so multi-date events appear once per date.
Occurrence and event IDs are opaque. Every occurrence includes the complete
public event fields, including sanitized HTML and plain-text descriptions and
all public links. The only nested event object is the parent relationship
summary; it prevents recursive payloads while retaining parent identity.

Schedules are discriminated by `kind`. A timed schedule has UTC ISO 8601
`startsAt` and nullable `endsAt`; a date-only schedule has a local `date`. Both
include `timeZone: "Europe/Oslo"`. Overnight events end on the following local
date.

Locations resolve in this order: referenced room, explicit free-text location,
then the venue `Det Akademiske Kvarter`. The venue fallback does not invent a
Sanity room ID. Descriptions are serialized from Portable Text and sanitized
to the supported HTML subset before they leave the API.

The website event detail page continues to use the shared server service
directly. There is no separate event-detail HTTP endpoint.

## Taxonomy discovery

`GET /api/v1/events/taxonomy` returns active published event types grouped by
Sanity category and all published rooms for interpreting IDs in the events feed.
`locale=nb` is the default; `locale=en` requests English names with Norwegian
as the field-level fallback. No date range is needed. Unknown query parameters
return `400`.

The response has two lists:

    {
      "eventTypeGroups": [
        {
          "id": "eventTaxonomyGroup-musikk",
          "name": "Konserter",
          "eventTypes": [
            { "id": "eventType-516d6356-5b19-422d-8548-68918fd05038", "name": "Konsert" }
          ]
        }
      ],
      "rooms": [
        { "id": "room-teglverket", "name": "Teglverket", "slug": "teglverket" }
      ]
    }

`eventTypeGroups` contains currently active published event types grouped by
category; `rooms` contains all published rooms. The example ID is illustrative;
request the endpoint for current IDs. These are Sanity source identifiers, not
Broadcast category names. Consumers should map IDs to their own taxonomy and
handle an unmapped ID explicitly. Names may change through editing or
localization.

## Caching and protocol

Both endpoints are anonymous and support cross-origin `GET`, `HEAD`, and `OPTIONS`.
Successful responses use a 60-second shared cache with five minutes of
stale-while-revalidate and include an `ETag`. A matching `If-None-Match` header
returns `304` without a body. `HEAD` has the same status and headers as `GET`
without a body. Errors are private and not cached.

The OpenAPI document is available at
`https://www.samfunnetibergen.no/api/v1/openapi.json`.

## Broadcast

Broadcast polls the complete default event snapshot and uses the occurrence
`id` as its stable match key. It can use the taxonomy endpoint to discover
source room and event type IDs for its mapping. Run the non-mutating source
audit before handoff:

    npm --workspace @samfunnet/web run events:audit:broadcast -- --report-only

The audit requires title, concrete UTC start and end timestamps, image, and a
taxonomy keyword for readiness. Missing ticket links are informational. A
missing room and missing free-text location are valid because they resolve to
Det Akademiske Kvarter; an explicit free-text venue still needs an external
Broadcast mapping.

Schema.org Event JSON-LD remains embedded on individual website detail pages
for search metadata. It is not an API representation, and there is no
standalone linked-data feed or iCalendar endpoint.
