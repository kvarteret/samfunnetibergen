# ADR 009: One versioned public events API

**Status:** Accepted

**Date:** 2026-09-01

**Revised:** 2026-09-02 after selecting one API for the mobile app and Broadcast

## Context

Sanity owns arrangement content, while `apps/web` resolves published
localization, parent inheritance, status, visibility, and Europe/Oslo
occurrences. External consumers need that resolved public result without
querying Sanity or reproducing its editorial rules.

The first implementation added `/api/v1/events` and retained an older
`/api/events/feed` route as a Schema.org `DataFeed`. Both representations read
the same internal service, but they still created two public serializers, test
surfaces, deployment checks, and contracts. The DataFeed was intentionally
lossy and did not define API versioning, filtering, pagination, errors,
localization, deletion reconciliation, or parent relationships.

Schema.org Event data remains useful when embedded on the corresponding public
event detail page for search metadata. A standalone DataFeed has no necessary
search-discovery role because detail pages already embed Event nodes and the
sitemap publishes their URLs.

Broadcast documents a remote API feed that may use any JSON structure it can
map. Its visible-event fields include a name, UTC start and end timestamps,
Broadcast venue ID, publication state, one to three tags, and an image. Ticket
link, price/free state, sold-out state, and modification timestamp are useful
optional fields. Broadcast therefore does not require Schema.org JSON-LD.

The mobile app needs compact chronological lists and rich detail navigation.
Broadcast needs a complete upcoming snapshot whose records contain all fields
needed for mapping without making one detail request per occurrence. These are
compatible needs when the collection summary is integration-complete but rich
content remains on the detail resource.

## Decision

Use the versioned API under `/api/v1` as the only external arrangement
integration contract. Remove `/api/events/feed`, its listing-page alternate
link, serializer, tests, documentation, and deployment smoke checks.

`GET /api/v1/events` is occurrence-first. One occurrence is one concrete stored
date for a public event. A multi-date single event produces multiple
occurrences with one shared event identity. Materialized series instances and
festival sessions normally produce one occurrence each. IDs are opaque.

The default request returns the complete today-forward occurrence snapshot in
the selected locale. This makes one polling request sufficient for Broadcast at
the current event volume. Requests that specify `from` or `to` use fixed
100-item cursor pages for bounded mobile and historical reads. Consumers follow
`links.next` unchanged.

Each collection record contains stable identity, status, effective
modification timestamp, normalized schedule, title, image, taxonomy, organizer,
location, pricing, ticket link, parent summary, and navigation links. It omits
rich description blocks, Facebook links, and complete
series/festival programs. `GET /api/v1/events/{slug}` provides those rich detail
fields. There is no batch-detail endpoint until a measured consumer need
justifies its additional failure, size, and caching semantics.

The public location resolution order is:

1. Use a referenced room when present.
2. Otherwise preserve an explicit free-text location.
3. Otherwise use the venue itself, `Det Akademiske Kvarter`.

The fallback is a public venue fact, not an invented Sanity room ID. The API
serializes it as location kind `venue`. Embedded page JSON-LD uses the canonical
Kvarteret Place identity and postal address.

Broadcast uses the occurrence ID as its stable match key. Ticket URLs remain
purchase metadata because multiple performances may share one URL. The initial
integration is pull-based. Before launch, Broadcast and Samfunnet must agree on
the Broadcast venue ID, room mapping, accepted tags, polling cadence,
cancellation behavior, and whether an occurrence missing from a later full
snapshot is drafted or removed.

Keep Schema.org Event JSON-LD embedded on individual event detail pages. Do not
add a replacement RSS, JSON Feed, or iCalendar route as part of this decision.

## Public contract

`GET /api/v1/events` accepts `locale=nb|en` and optional inclusive `from` and
`to` dates. Norwegian is the default and fallback locale. A request without
dates returns the full upcoming snapshot; a dated request returns up to 100
items and an opaque next link. Successful responses contain `data`, `meta`, and
`links`.

`GET /api/v1/events/{slug}` accepts the same locale and returns one approved
event, including historical events. A parent returns its approved child
program. A child links to its parent summary.

`GET /api/v1/openapi.json` describes both supported routes. All v1 routes allow
anonymous cross-origin GET, HEAD, and OPTIONS requests. They use a 60-second
shared cache and five-minute stale-while-revalidate window. Errors have stable
`code` and `message` fields. Breaking changes require `/api/v2`; clients must
tolerate additive optional fields within v1.

The API exposes only public resolved fields. Approval state, submission contact
data, booking provenance, promotion controls, recurrence rules, and other
editorial fields remain private.

## Broadcast readiness

The repository audit checks locally controlled source completeness without
making external writes. A paid occurrence needs a title, UTC start and end
timestamps, image, and taxonomy keyword. Ticket URLs are optional purchase
metadata because their availability and placement cannot be guaranteed; the
audit reports a missing ticket URL as information rather than a readiness
failure. A missing room and missing
free-text location is valid because it resolves to Det Akademiske Kvarter. An
explicit free-text venue still needs a confirmed Broadcast mapping.

The audit reports missing or shared ticket URLs as information rather than
collapsing occurrences. Missing required fields keep an event from being
locally ready; Broadcast may create incomplete mapped records as drafts.
Readiness counts are dated content observations rather than permanent test
assertions.

## Consequences

There is one maintained external schema, one OpenAPI document, and one set of
deployment firewall rules. Broadcast and mobile consumers see the same
occurrence identity, schedule normalization, status, and location fallback.
Removing the DataFeed is a breaking removal for any unknown consumer, so request
logs should be checked before production deployment.

The default snapshot grows with future materialized occurrences. Current volume
is small enough for one response, but response size must be observed. If it
becomes materially large, a future version may require pagination or a defined
snapshot export without duplicating the domain model.

Broadcast mapping remains an external operational dependency. The general API
must not adopt Broadcast-proprietary field names or venue IDs as its canonical
domain unless a separately reviewed requirement warrants that coupling.

## Alternatives considered

Keeping the Schema.org DataFeed was rejected because it duplicated the public
contract without being required by Broadcast or search discovery. Expanding it
with non-standard properties would preserve unclear synchronization semantics.

Returning every rich detail field in every occurrence was rejected because
multi-date events would repeat large Portable Text and relationship payloads.
Requiring Broadcast to follow every detail link was rejected because the
collection can cheaply include its mapping fields and avoid an N+1 request
pattern.

Using ticket URL as identity was rejected because commerce URLs are mutable and
may be shared by several performances. Adding a batch-detail route was deferred
because neither named consumer currently needs it.
