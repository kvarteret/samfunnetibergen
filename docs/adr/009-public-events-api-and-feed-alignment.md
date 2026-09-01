# ADR 009: Public events API and representation boundaries

**Status:** Accepted
**Date:** 2026-09-01
**Revised:** 2026-09-01 after selecting Schema.org `DataFeed` for the secondary
linked-data representation and identifying Broadcast as its first intended
consumer
**Relates to:** ADR 005 (materialized event instances and festival event
graphs), ADR 007 (separate Studio deployment with a shared content contract)

## Context

Sanity is the source of truth for public arrangements. The website resolves
those documents through `apps/web/src/lib/sanity/queries/events.ts` and
`apps/web/src/lib/sanity/fetch/events.ts`, then presents them on the
arrangement list, arrangement calendar, arrangement detail pages, and
homepage.

The arrangement model intentionally distinguishes five kinds of record:
`single`, `seriesParent`, `seriesInstance`, `festivalParent`, and
`festivalSession`. Normal public listings use concrete records (`single`,
`seriesInstance`, and `festivalSession`). A series or festival parent is an
overview record reached through a child relationship and can list its child
program. Child content may inherit public fields from its parent, and its
effective real-world status combines child and parent status according to ADR 005.

The card list and calendar are different presentations of the same public
content. The list keeps the first upcoming child of each series or festival so
repeated inherited titles do not fill the page. The calendar keeps every
concrete occurrence and starts on Monday of the current Europe/Oslo week. The
list and homepage use today as their upcoming boundary.

`/api/events/feed` is currently advertised from `/arrangementer` as
`application/ld+json` and emits a Schema.org `ItemList`. It is neither a
lossless application API nor a standard calendar-subscription format.
Schema.org defines `ItemList` as a generic list of items, while `DataFeed` is
the more specific vocabulary type for a feed. Neither type defines the
versioning, pagination, relationship, localization, or synchronization
contract external application clients need.

The current feed discards public domain fields such as event kind, parent
relationships, taxonomy, separate prices, Facebook links, room metadata,
image captions, and stable source identity. It also rejects an event node when
location is absent. A source-backed audit on 2026-09-01 found 73 upcoming
concrete date entries in the production Sanity dataset but only 46 nodes in a
locally rebuilt JSON-LD feed. Twenty-five Quiz series instances and two single
events were omitted because their location was missing. Multi-date singles
were flattened within each event row rather than globally, which placed
October and November dates before later September events. Thirteen overnight
occurrences produced an end timestamp earlier than their start timestamp
because the end time stayed on the start date. These are projection defects,
not missing Sanity occurrences.

The standalone JSON-LD route also has no necessary search-discovery role.
Arrangement detail pages already embed Schema.org `Event` JSON-LD through
`apps/web/src/app/[locale]/arrangementer/[event]/page.tsx`, and
`apps/web/src/app/sitemap.ts` publishes localized event detail URLs. Google
recommends putting Event markup on a unique event leaf page and explicitly
recommends event pages instead of pages that list schedules or multiple
events. Its structured-data guidance treats JSON-LD as markup embedded in the
HTML page that contains the corresponding visible content. See the official
[Event structured-data guidance](https://developers.google.com/search/docs/appearance/structured-data/event)
and [structured-data introduction](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data).

An external party needs a stable, lossless contract that can reproduce the
information available through `/arrangementer`, its calendar, and event detail
pages without learning Sanity's query or inheritance rules. Extending the
Schema.org response with non-standard properties would mix search metadata and
application data while still failing to define a broadly interoperable feed.

Calendar subscription is a separate possible product need. The standard
iCalendar format represents exchangeable calendar events independently of a
particular calendar application, but it cannot express the complete Samfunnet
event graph as the primary integration contract. No public iCalendar route
exists in the current source at the time of this decision; stale agent guidance
that names `apps/web/src/app/api/ical/route.ts` does not match the repository.
See [RFC 5545](https://www.rfc-editor.org/info/rfc5545/).

Broadcast is the first concrete external consumer. The June 2026 conversation
with Broadcast established a minimum goal: every relevant event with a ticket
URL should become visible in Broadcast, recurring events must be unfolded into
verified occurrences, and a later webhook phase may notify Broadcast about
updates or cancellations. Broadcast's current ingestion documentation accepts
a remote JSON endpoint in any mappable structure, but its preferred event
record requires `name`, UTC `startTime`, UTC `endTime`, a Broadcast venue id,
`published`, one to three `tags`, and `pic`. Ticket link, price text, free-entry
state, sold-out state, and last-updated time are optional. An event missing a
required field is created as a draft rather than becoming visible. See
[Broadcast event data feeds](https://docs.broadcast.events/event-data).

A dated production audit on 2026-09-01 found 34 upcoming occurrences with an
effective ticket URL. All 34 had a resolved image and taxonomy, but nine lacked
a start time, eleven lacked an end time, and one lacked a location. Only 22 met
all locally verifiable Broadcast requirements before resolving Broadcast's
venue id and accepted tag vocabulary. The 34 occurrences used 26 unique ticket
URLs; one URL was shared by nine occurrences. A ticket URL is therefore not a
safe event identity or idempotency key.

## Decision

Keep `/api/events/feed`, but replace its Schema.org `ItemList` representation
with a Schema.org `DataFeed`. Keep the `application/ld+json` alternate link on
`/arrangementer`. This endpoint is a secondary linked-data export, not the
supported lossless application contract and not a calendar-subscription
format.

Use the DataFeed as the proposed remote pull endpoint for Broadcast. Broadcast
maps the standard Schema.org fields into its preferred ingestion fields. Do not
make Broadcast's proprietary field names the canonical v1 event model. If
Broadcast rejects the DataFeed mapping during onboarding, revise this ADR
before adding a partner-specific route rather than silently mixing proprietary
fields into `/api/v1/events`.

Add a versioned, occurrence-first public API under `/api/v1` as the supported
external integration contract. The website and API call one server-side
public-event service. Website code does not call the public HTTP API
internally; it uses the shared TypeScript service directly.

Keep Schema.org JSON-LD embedded on individual arrangement detail pages and
keep event URLs in the sitemap. Detail-page structured data remains search/page
metadata. The DataFeed remains a lossy structured export. Neither is a second
lossless API contract. A separate iCalendar representation may be proposed
later if calendar subscription or import becomes an explicit user requirement.
It must complement, not replace, the JSON API.

An **occurrence** is one concrete date entry that a calendar can sort and
display. A multi-date `single` produces several occurrences that share one
event identity. Each materialized `seriesInstance` or `festivalSession`
normally produces one occurrence. Series and festival parents are not mixed
into the occurrence collection; they are linked detail resources.

### Collection endpoint

`GET /api/v1/events` returns a JSON envelope with `data`, `meta`, and `links`.
Each `data` item is an occurrence summary containing:

- a stable opaque occurrence id;
- the stored local date and optional local start/end times;
- normalized RFC 3339 timestamps when a start time is known;
- the `Europe/Oslo` time zone and a derived end date;
- an event summary with opaque event id, slug, event kind, effective status,
  localized title, image, taxonomy, organizer, location, optional parent
  summary, and links to the API detail and localized website detail.

When an end time is earlier than the start time, the normalized end date is the
following calendar date. A date without a start time remains date-only; the API
does not falsely label an unknown time as an all-day event.

The supported query contract is:

- `locale=nb|en`, defaulting to `nb`, with the same requested-locale then
  Norwegian fallback as the website;
- with no `from` or `to`, all materialized occurrences from the current Oslo
  date onward in one unpaginated response;
- with either inclusive `from` or `to`, fixed pages of 100 occurrences and an
  opaque next cursor/link when another page exists;
- an intentionally undocumented `includeInternal=true` option that includes
  internal events in the new API only.

The cursor is bound to the locale, date range, and internal-event setting that
created it. A mismatched, malformed, or expired cursor is an invalid request,
not permission to change those inputs. Occurrences are globally ordered by
start date, known start time before unknown time, event id, and stored date
entry key so the ordering remains deterministic when titles change.

The undocumented internal option is not an authorization mechanism. Anyone
who discovers it can call it. Internal arrangements must therefore not contain
secrets or sensitive data. Normal website pages, website detail lookup,
detail-page JSON-LD, and documented API calls exclude internal events.
Draft/Presentation preview remains able to render them for editors.

### Detail endpoint

`GET /api/v1/events/{slug}` returns any approved public event kind, including
an approved historical event. It returns the fully resolved public record:

- rich Portable Text and derived plain-text description;
- image and caption;
- event type and taxonomy group;
- organizer group or free-text organizer;
- room metadata or free-text location;
- free/paid state and separate ordinary, student, and member prices in NOK;
- website, API, ticket, and Facebook links;
- effective status and parent relationship;
- ordered occurrences.

A series or festival parent returns its full overview content and the ordered
approved child occurrences that make up its public program. A child returns a
parent summary. A multi-date single returns all of its date occurrences. An
internal record behaves as not found unless the undocumented opt-in is present.
The slug matches the public website detail URL; opaque event and occurrence ids
are returned for synchronization but their string format is not a public
parsing contract.

### DataFeed, detail-page structured data, and optional calendar exchange

`GET /api/events/feed` returns `application/ld+json; charset=utf-8` with a
Schema.org `DataFeed` root. Its `@id` and `url` identify the feed endpoint. Its
`dataFeedElement` array contains one `DataFeedItem` per public occurrence in
the same global order as the default v1 collection. Each `DataFeedItem` wraps a
Schema.org `Event` in its `item` property. The DataFeedItem has an absolute
`@id` under the feed URL derived from the opaque occurrence id; the wrapped
Event keeps its distinct canonical website/occurrence `@id`. The feed is
Norwegian (`inLanguage: "nb"`), matching the current route. When source
modification timestamps are exposed, the item uses the latest effective
timestamp across the occurrence record and inherited parent content.

The DataFeed uses the same public occurrence service, effective status,
canonical web links, normalized timestamps, and Europe/Oslo overnight handling
as `/api/v1/events`. An occurrence with no location remains in the DataFeed;
its Event simply omits `location`. The serializer must not invent `Kvarteret`
or drop the occurrence. The feed remains intentionally lossy: consumers that
need event kinds, parent graphs, taxonomy, complete localized content, price
variants, or supported pagination use `/api/v1`.

For Broadcast compatibility, timed DataFeed Event values use full UTC ISO 8601
timestamps with a `Z` suffix. Each Event includes `keywords` derived from its
resolved taxonomy group and event type, deduplicated and limited to three;
`image` when available; `isAccessibleForFree`; complete Schema.org `Offer`
entries for known price categories and the ticket URL; and the effective
modification time on its DataFeedItem. The source taxonomy labels are not
assumed to be Broadcast's accepted vocabulary; Broadcast owns the translation
unless it supplies an allowlist that becomes a separately reviewed mapping.

The proposed Broadcast mapping is:

| Broadcast concept          | DataFeed source                                                      |
| -------------------------- | -------------------------------------------------------------------- |
| stable event identity      | DataFeedItem `@id`, derived from the occurrence id                   |
| `name`                     | Event `name`                                                         |
| `startTime` / `endTime`    | Event `startDate` / `endDate`, both UTC with `Z`                     |
| `venueId`                  | Broadcast mapping from the canonical Place or containing Place `@id` |
| `cover` / `freeEntry`      | Event `offers` / `isAccessibleForFree`                               |
| `ticketLink`               | Event `offers.url`                                                   |
| `published` / cancellation | Event `eventStatus` plus full-snapshot reconciliation                |
| `tags`                     | Event `keywords`                                                     |
| `pic`                      | Event `image`                                                        |
| `lastUpdated`              | DataFeedItem `dateModified`                                          |

The ticket URL is purchase metadata only. Broadcast must match updates by the
stable occurrence-derived DataFeedItem id. Two performances sharing a ticket
page remain separate Broadcast events.

The arrangement detail page continues to emit one Schema.org `Event` node per
eligible concrete occurrence represented on that page. A multi-date single may
therefore emit multiple Event nodes. Node construction uses the same normalized
occurrence schedule as the website and API, which fixes overnight end dates and
Europe/Oslo offsets.

Structured data must remain truthful. If an occurrence lacks the fields
required to describe an accurate Schema.org Event, the detail page may omit
that node rather than inventing a venue. The occurrence remains present in the
JSON API with the actual missing value represented as `null`. Search eligibility
and API completeness are separate concerns.

Schema.org describes `DataFeed` as structured information about one or more
entities and `DataFeedItem` as one item within that feed, so those types express
the retained route more accurately than `ItemList` and `ListItem`. They still
do not define the complete Samfunnet integration contract. See
[Schema.org DataFeed](https://schema.org/DataFeed) and
[Schema.org DataFeedItem](https://schema.org/DataFeedItem).

Do not add iCalendar as part of this implementation. If a later product
decision requires calendar subscription or import, define a separate
`text/calendar` endpoint with one `VEVENT` per public occurrence and links back
to the JSON API and website. That representation is intentionally lossy and
must not become an alternative source of full event details.

### Broadcast onboarding boundary

Before Broadcast ingestion is considered ready, obtain and record written
agreement on the DataFeed URL and mapping, the canonical Kvarteret venue id and
whether rooms are stages or separate venues, the tag translation/allowlist,
full-snapshot removal behavior, cancellation mapping, polling cadence, and the
stable occurrence id. Do not guess these external values in code or Sanity.

Run a readiness report over every upcoming occurrence with an effective ticket
URL. A visible Broadcast candidate must have a title, start and end times,
image, at least one taxonomy-derived keyword, ticket URL, and a location that
maps to the agreed Broadcast venue. Report incomplete records for editorial
repair; do not invent an end time, image, location, tag, or venue id. The
general public API and DataFeed may still contain truthful incomplete records,
but the Broadcast importer will leave them in draft until corrected.

The first delivery is pull-based. Webhooks are a follow-up after Broadcast has
successfully imported and reconciled the complete DataFeed. A webhook design
must define authentication, retries, idempotency, ordering, replay, and payload
versioning in a separate decision. “Two-way sync” is not part of this ADR.

### Shared service and public boundaries

The shared service owns approval and internal visibility filters, localization,
parent inheritance, effective status, festival-image override behavior,
date-range selection, occurrence flattening, schedule normalization, and
ordering. Existing website fetch helpers delegate to this service and may adapt
its result for a page:

- `/arrangementer` keeps its first-child-per-parent list presentation;
- `/arrangementer/kalender` keeps every occurrence from the current Oslo
  week's Monday;
- homepage/list fetches keep the today-forward boundary;
- detail pages keep approved historical lookup and parent programs;
- detail-page JSON-LD projects eligible occurrences from the same normalized
  records;
- `/api/events/feed` projects the default public occurrence set as a lossy
  Schema.org DataFeed.

The API is anonymous and read-only. `/api/v1` supports GET, HEAD, and OPTIONS
with `Access-Control-Allow-Origin: *`. Responses use public caching with a
60-second shared-cache lifetime and stale-while-revalidate. Vercel firewall or
deployment protection must allow unauthenticated automated access to
`/api/v1/*` and `/api/events/feed`; browser CORS headers cannot bypass a Vercel
security checkpoint.

Publish a machine-readable OpenAPI document at `/api/v1/openapi.json` and a
concise integration guide. The OpenAPI response components derive from the
same Zod schemas used by the implementation, using Zod 4's JSON Schema support
and a small hand-authored OpenAPI path document. The undocumented internal
query option is omitted from both forms of documentation.

Changing `ItemList` to `DataFeed` is a breaking representation change at the
same URL. Before deployment, inspect the available production request logs for
non-crawler consumers and record the result in the ExecPlan. No repository or
sibling-repository consumer is currently verified, and the endpoint currently
returns a Vercel Security Checkpoint to unauthenticated automation. If a real
external consumer is found, release `/api/v1` first and communicate the feed
shape change before deployment.

## Consequences

External consumers get every public occurrence, including recurring instances,
festival sessions, multi-date singles, and events with no location. They can
render a calendar immediately and follow a stable link to the complete event
or its series/festival overview.

Search engines continue to discover localized event URLs through the sitemap
and receive Event JSON-LD next to the corresponding visible detail-page
content. The separately advertised JSON-LD route now truthfully identifies
itself as a Schema.org DataFeed rather than a generic ordered list.

The website and API share normalization and selection rules rather than
maintaining parallel GROQ projections. Presentation-specific grouping remains
explicit, so synchronization does not force the list and calendar to become
the same interface.

The occurrence API duplicates compact event summaries across occurrences. This
is intentional: calendar clients can render one response without a detail
request, while large descriptions and external commercial links remain in the
detail resource.

The default unpaginated response grows with the number of materialized future
occurrences. This matches the current website's upstream bound. Explicit date
queries paginate at 100 to make historical or otherwise broad synchronization
requests bounded on the wire. If the default future set becomes materially
larger, changing it to pagination is a future versioned-contract decision.

The hidden internal option provides convenience, not confidentiality. A future
requirement for genuinely restricted volunteer content requires authenticated
authorization and must not reuse this convention as a security boundary.

The API contract becomes public maintenance surface. Breaking response or
semantic changes require `/api/v2`; additive optional fields may be introduced
within v1 with tests and OpenAPI updates.

Changing an advertised route's root type and member shape is a breaking change
for any unknown consumer. The production-log check and communication step make
that risk explicit. The retained DataFeed also remains an additional
maintenance surface, so its tests must prove it is derived from the same
occurrence source as v1.

Broadcast becomes a named external consumer but not the owner of Samfunnet's
public API schema. The integration can start with its mapper and the open
DataFeed, while v1 remains useful to other clients and as the lossless debugging
source for any mapped Broadcast event.

Current content remediation is a launch prerequisite. The dated audit shows
that twelve ticketed occurrences fail at least one local readiness condition;
the exact count will change as editors update Sanity, so deployment gates on a
fresh report rather than the historical number.

## Alternatives considered

### Keep the existing `ItemList` unchanged

Rejected. `ItemList` is a generic ordered-list vocabulary and does not
accurately name the endpoint as a feed. Keeping the old shape only for
compatibility would preserve its projection defects and ambiguous purpose.

### Expand `/api/events/feed` into the application API

Rejected. Non-standard JSON-LD properties would combine page metadata and
application data, preserve unclear versioning and validation semantics, and
make every future API concern a structured-data concern.

### Remove the feed and rely on page JSON-LD plus the API

Rejected. That is the smallest representation surface and remains a reasonable
future simplification, but this decision retains a discoverable linked-data
export. Using `DataFeed` makes that retained purpose explicit while `/api/v1`
handles full application integration.

### Replace the feed with iCalendar

Rejected as the primary external contract. iCalendar is appropriate for
calendar subscription and import, but it is lossy for localized rich content,
taxonomy, price variants, parent programs, and API traversal. It remains a
future complementary option if users actually need calendar subscription.

### Use the ticket URL as the Broadcast idempotency key

Rejected. Ticket URLs are mutable commerce links rather than occurrence
identities, and multiple performances can share one ticket page. The production
audit already found one ticket URL shared by nine future occurrences. Use the
opaque stable occurrence id and expose the ticket URL separately.

### Add a Broadcast-shaped public route immediately

Rejected for the initial integration. Broadcast documents that it can map
arbitrary JSON feed structures, and the DataFeed can carry the required public
semantics without coupling the general API to proprietary names. Add a
partner-specific adapter only if Broadcast cannot map the agreed DataFeed, and
record that change here first.

### Return one event with a dates array

Rejected for the collection. Every calendar consumer would have to reimplement
flattening, global sorting, overnight normalization, and occurrence identity.
The detail endpoint still returns an event-shaped resource with its
occurrences.

### Return nested series and festival graphs in the collection

Rejected. It makes singles and child occurrences structurally different and
requires recursive traversal for a chronological calendar. Linked parent
detail resources retain the graph without compromising the flat collection.

### Make website pages call the HTTP API

Rejected. Internal HTTP adds latency, deployment coupling, URL construction,
and failure modes without improving semantic reuse. A shared server-only
service gives the API and React routes the same source contract directly.

### Require API credentials

Rejected. The content is already public, the API is read-only, and anonymous
CORS access is a deliberate product requirement. Vercel protection must be
configured to permit this path.

## Implementation boundary

Implementation is defined by
`.agents/execplans/022-public-events-api-and-feed-alignment.md`. It requires web
query, normalization, route, structured-data, metadata, test, OpenAPI,
deployment, Broadcast-readiness, and documentation changes. It does not add an
iCalendar endpoint. It must not automatically mutate Sanity content; editorial
remediation of incomplete ticketed events is a separate launch task based on
the readiness report.

Current source evidence:

- `apps/studio/src/studio/schemaTypes/documents/arrangement.ts` owns event
  kinds, parent references, status, public fields, and internal-event intent.
- `apps/web/src/lib/sanity/queries/events.ts` owns public event projections and
  currently gives listing and feed separate query shapes.
- `apps/web/src/lib/sanity/fetch/events.ts` resolves inheritance, effective
  status, defaults, and parent summaries for website consumers.
- `apps/web/src/app/[locale]/arrangementer/page.tsx` owns the list and currently
  advertises `/api/events/feed` as an alternate representation.
- The calendar route on `origin/develop` owns calendar presentation behavior.
- `apps/web/src/app/[locale]/arrangementer/[event]/page.tsx` embeds Event
  JSON-LD and exposes full records plus parent child-program navigation.
- `apps/web/src/app/sitemap.ts` publishes localized event detail URLs.
- `apps/web/src/app/api/events/feed/route.ts` and
  `apps/web/src/lib/structured-data.ts` own the standalone JSON-LD projection
  that this decision changes from ItemList/ListItem to
  DataFeed/DataFeedItem.
- Broadcast owns the external ingestion mapping and venue identifiers.
  `https://docs.broadcast.events/event-data` is the verified input contract;
  no current repository source calls a Broadcast API or webhook.
