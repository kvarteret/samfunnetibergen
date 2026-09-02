# Build a public occurrence API and align the JSON-LD DataFeed

This ExecPlan is a living document. The Progress, Surprises & Discoveries,
Decision Log, and Outcomes & Retrospective sections must be kept up to date as
work proceeds. Maintain this document in accordance with `.agents/PLANS.md`.

## Purpose / Big Picture

After this change, an external developer can request every public Samfunnet
event occurrence from `/api/v1/events`, render the same dates, titles, images,
taxonomy, organizer, location, status, and parent relationships used by the
arrangement website, then follow `/api/v1/events/{slug}` to get the complete
event or series/festival overview. Norwegian and English content are selected
with a locale parameter. The API is anonymous, browser-callable, documented by
OpenAPI, and usable without a Vercel security checkpoint.

The existing `/api/events/feed` changes from a generic Schema.org `ItemList` to
a Schema.org `DataFeed` containing one `DataFeedItem` per occurrence. It remains
advertised as an `application/ld+json` alternate, while event-detail JSON-LD and
the sitemap continue to provide page-level search discovery. The DataFeed is a
lossy linked-data export; `/api/v1` is the only contract intended to reproduce
all public arrangement information. The arrangement list, arrangement calendar,
homepage, event detail, API, and DataFeed share one server-side event
normalization boundary.

Broadcast is the first intended DataFeed consumer. After implementation,
Broadcast can poll the endpoint, map its standard Event fields to Broadcast's
ingestion model, and keep separate performances synchronized by stable
occurrence identity. The initial delivery remains pull-based. Ticketed events
that lack a real start time, end time, image, taxonomy keyword, or mappable
venue are reported for editorial repair rather than completed with invented
data.

This plan does not add an iCalendar endpoint. Calendar subscription is a
different, intentionally deferred product capability: if required later, a
`text/calendar` representation will complement the complete JSON API rather
than replace it.

The accepted architecture and public contract are recorded in
`docs/adr/009-public-events-api-and-feed-alignment.md`. This plan is
self-contained and repeats the implementation decisions needed to deliver it.

## Progress

- [x] (2026-09-01) Read `.agents/README.md`, `.agents/PLANS.md`, the arrangement,
      TypeGen, repository-interaction, and installed Next.js route-handler guidance.
- [x] (2026-09-01) Verified current event schema, queries, fetch resolution,
      list, calendar on `origin/develop`, detail page, JSON-LD route, and structured
      data builder.
- [x] (2026-09-01) Audited the production Sanity data and locally rebuilt the
      existing feed without writing content.
- [x] (2026-09-01) Recorded the API decisions in ADR 009 and this ExecPlan.
- [x] (2026-09-01) Re-evaluated the feed against search, application API, and
      calendar-subscription needs; revised ADR 009 and this plan to use DataFeed as
      a secondary linked-data representation.
- [x] (2026-09-01) Read Broadcast's current ingestion documentation and the
      June 2026 correspondence; audited current ticketed occurrence readiness.
- [x] (2026-09-01) Reconciled the implementation branch from
      `origin/develop`, which already contains the calendar commits, while
      preserving the unrelated untracked booking ExecPlan 021.
- [x] (2026-09-01) Implemented and tested the published public-event query,
      pure inheritance/status/schedule/occurrence domain, and server-side API
      service for the v1 slice. Website consumers still use their compatibility
      fetchers and will be migrated in the next slice.
- [x] (2026-09-01) Migrated homepage/list/calendar/public detail reads,
      detail-page JSON-LD, and the DataFeed to the shared occurrence service.
- [x] (2026-09-01) Implemented and contract-tested `/api/v1/events` and
      `/api/v1/events/{slug}`, including locale/range parsing, 100-item cursor
      pagination, internal opt-in, CORS/OPTIONS/HEAD, error envelopes, and
      Zod output validation.
- [x] (2026-09-01) Published the generated OpenAPI route and external
      integration guide, updated source-backed repository boundaries, and
      added staged-release smoke checks for the API/OpenAPI/DataFeed.
- [ ] Inspect production request logs for unknown feed consumers and communicate
      the breaking ItemList-to-DataFeed shape change before deployment if needed.
- [x] (2026-09-01) Added the pure Broadcast readiness adapter, safe report-only
      audit, release-gate mode, duplicate-ticket information, and fixture tests.
      External mapping agreement and handoff remain blocked on Broadcast.
- [x] (2026-09-01) Ran the full workspace tests (web 318 tests, Studio 123,
      content-domain 35), all workspace TypeScript checks, both lint targets,
      format check, route TypeGen, Sanity TypeGen, diff check, and the
      production web build. The Broadcast release-gate command also correctly
      exits nonzero while the live content has incomplete ticketed records.
- [x] (2026-09-02) Removed the superseded website event-query compatibility
      layer and dead promotion/Supabase code, moved pages and the calendar onto
      the shared event/occurrence service, and retained the undocumented
      `includeInternal=true` escape hatch by explicit user decision.
- [x] (2026-09-02) Regenerated both Sanity type targets and reran route TypeGen,
      the production web build, all workspace typechecks/lints/format checks,
      and all tests (web 322, Studio 123, content-domain 35). The report-only
      Broadcast audit completed against current data with 21 of 39 paid
      occurrences complete.
- [ ] Deploy, remove the Vercel checkpoint from public API paths, and complete
      unauthenticated production smoke tests.

## Surprises & Discoveries

- Observation: the working checkout on 2026-09-01 is ahead of its local work
  but behind `origin/develop`; the deployed calendar implementation exists on
  `origin/develop` and not in the checked-out files.
  Evidence: `git status --short --branch` reported `ahead 4, behind 6`, and
  `origin/develop` contains
  `apps/web/src/app/[locale]/arrangementer/kalender/page.tsx` plus the calendar
  domain/components. Implement against a branch containing those commits.

- Observation: the card list and calendar already share
  `fetchPublishedEvents(locale)` but deliberately have different presentation
  boundaries.
  Evidence: the list calls `filterToFirstInstances`; the calendar calls
  `buildCalendarMonths`, which retains every occurrence from Monday of the
  current Oslo week.

- Observation: the existing feed is a lossy Schema.org transformation rather
  than the same domain record returned to React pages.
  Evidence: `feedEventsQuery` projects a reduced shape and
  `buildEventStructuredDataNode` returns `null` when both room and free-text
  location are absent.

- Observation: on 2026-09-01 the production dataset contained 68 upcoming
  concrete event rows and 73 future date entries, while a local execution of
  `GET()` from the current feed route emitted 46 Schema.org nodes.
  Evidence: 25 Quiz instances and two singles had no location, exactly the 27
  omitted occurrences. These numbers are dated evidence, not test fixtures or
  permanent acceptance counts.

- Observation: the current feed flattens every date for one event before moving
  to the next event.
  Evidence: Karaoke's September, October, and November dates appeared together
  before later September events in the rebuilt JSON-LD output.

- Observation: the current structured-data timestamp builder applies
  `endTime` to `startDate` unconditionally.
  Evidence: a 21:00–02:30 Karaoke occurrence produced an end timestamp on the
  same date at 02:30, earlier than its start. Thirteen audited feed nodes had
  this problem.

- Observation: `isInternalEvent` is excluded by the feed query but not by the
  ordinary published list or detail queries.
  Evidence: only `feedEventsQuery` contains
  `coalesce(isInternalEvent, parentEvent->isInternalEvent, false) != true`.
  The new shared boundary must resolve this inconsistency without blocking
  editor preview.

- Observation: the public deployment presented a Vercel Security Checkpoint to
  unauthenticated browser and curl requests for `/api/events/feed`.
  Evidence: the response title was `Vercel Security Checkpoint` and direct curl
  returned HTTP 403. Route-level CORS cannot correct a project firewall rule.

- Observation: current `.agents` guidance names
  `apps/web/src/app/api/ical/route.ts`, but that route does not exist in the
  working tree or `origin/develop`.
  Evidence: `rg --files apps/web/src/app/api` and a recursive tree listing of
  `origin/develop` contain no iCalendar route. Update the stale guidance as
  part of documentation work; do not treat iCalendar as an existing public
  boundary.

- Observation: the arrangement detail page and sitemap already own the useful
  search-discovery behavior attributed to the standalone feed.
  Evidence: `apps/web/src/app/[locale]/arrangementer/[event]/page.tsx` embeds
  `buildEventStructuredData(...)`, while `apps/web/src/app/sitemap.ts` includes
  localized event slugs. Current Google Event guidance recommends markup on
  unique event leaf pages rather than schedule or multi-event list pages.

- Observation: Broadcast accepts a remote JSON endpoint in any structure it
  can map, but its preferred visible-event record requires a name, UTC start
  and end timestamps, Broadcast venue id, published state, one to three tags,
  and an image.
  Evidence: `https://docs.broadcast.events/event-data` states that missing
  required data creates a draft and that all timestamps must use UTC with a `Z`
  suffix. It also supports webhooks as a separate input option.

- Observation: current ticket URLs are not unique per occurrence.
  Evidence: the 2026-09-01 production audit found 34 upcoming ticketed
  occurrences using 26 unique ticket URLs; one ticket URL was shared by nine
  occurrences. Ticket URL cannot be the integration idempotency key.

- Observation: not every current ticketed occurrence can become visible in
  Broadcast without editorial correction.
  Evidence: of 34 upcoming ticketed occurrences, all had an image and taxonomy,
  but nine lacked a start time, eleven lacked an end time, and one lacked a
  location. Twenty-two met all locally checkable requirements before Broadcast
  venue-id and tag-vocabulary agreement. Counts are dated evidence, not fixed
  acceptance values.

- Observation: a later 2026-09-01 readiness run found 38 upcoming ticketed
  occurrences, of which 21 passed local checks. It reported 11 missing end
  times, 9 missing start times, 4 missing ticket URLs, and 3 unmapped rooms;
  duplicate ticket URLs are informational and do not collapse occurrences.
  Evidence: `npm run events:audit:broadcast` against the published Sanity
  projection. These counts are dated content evidence, not permanent
  acceptance values.

- Observation: `TZDate.toISOString()` in the installed `@date-fns/tz` version
  preserves the local offset instead of emitting a UTC `Z` timestamp.
  Evidence: the first overnight test returned
  `2026-10-25T21:00:00.000+01:00`; converting the zoned value through
  `new Date(zonedDate.getTime()).toISOString()` now returns the required
  `2026-10-25T20:00:00.000Z`.

- Observation: the v1 route can use one bounded Sanity result for total-count
  and cursor pagination while the current dataset is small.
  Evidence: the API tests traverse 205 occurrences in three 100/100/5 pages
  with no duplicate ids. The cursor still encodes the complete ordering key
  and request fingerprint; a future large-range optimization can add a
  count/query split without changing the public response contract.

## Decision Log

- Decision: initially planned to retain `/api/events/feed` while adding
  `/api/v1/events` and `/api/v1/events/{slug}`. This decision is superseded by
  the later representation-boundary decision below.
  Rationale: the first design assumed the advertised JSON-LD route had an
  independent crawler-syndication role. The subsequent standards and source
  review did not support that assumption.
  Date/Author: 2026-09-01 / user and Codex.

- Decision: after considering removal, retain `/api/events/feed` but change it
  from Schema.org `ItemList`/`ListItem` to `DataFeed`/`DataFeedItem`. Keep the
  listing-page `application/ld+json` alternate.
  Rationale: `DataFeed` names the retained linked-data purpose more accurately.
  It remains explicitly secondary and lossy; `/api/v1` is the complete,
  versioned integration contract, while detail-page JSON-LD plus the sitemap
  own search discovery.
  Date/Author: 2026-09-01 / user and Codex.

- Decision: use the DataFeed as the proposed remote pull endpoint for
  Broadcast, while keeping `/api/v1` as the complete public application
  contract.
  Rationale: Broadcast explicitly supports mapping arbitrary JSON feed shapes.
  Schema.org fields keep the public export open and reusable without adding
  Broadcast's proprietary names to the core API.
  Date/Author: 2026-09-01 / user and Codex.

- Decision: use the stable occurrence id, not the ticket URL, as Broadcast's
  match/idempotency identity.
  Rationale: repeated performances can share a ticket page, and the production
  dataset already contains a URL shared by nine occurrences. Ticket URL remains
  purchase metadata.
  Date/Author: 2026-09-01 / user and Codex.

- Decision: require UTC `Z` timestamps and truthful readiness data for
  Broadcast candidates; do not synthesize missing times, images, locations,
  tags, or venue ids.
  Rationale: Broadcast requires start/end timestamps and creates incomplete
  events as drafts. Invented values could publish materially false event
  information.
  Date/Author: 2026-09-01 / user and Codex.

- Decision: defer webhooks until Broadcast has successfully reconciled the
  complete pull feed.
  Rationale: webhook authentication, retries, ordering, replay, and deletion
  semantics require a separate operational contract. They are not needed to
  prove the first one-way integration.
  Date/Author: 2026-09-01 / user and Codex.

- Decision: do not replace the DataFeed with RSS, Atom, JSON Feed, or iCalendar
  in this implementation.
  Rationale: DataFeed satisfies the requested linked-data representation but
  does not pretend to be the complete API. iCalendar has a legitimate but
  narrower subscription/import use; it should be added only after a separate
  product decision and then remain a lossy complement to the JSON API.
  Date/Author: 2026-09-01 / user and Codex.

- Decision: make the collection occurrence-first.
  Rationale: every calendar client receives globally sortable dates without
  expanding multi-date events or understanding materialized Sanity children.
  Date/Author: 2026-09-01 / user and Codex.

- Decision: use a shared server-side service rather than making website pages
  call the HTTP API.
  Rationale: it keeps queries, inheritance, status, and time normalization
  synchronized without internal HTTP latency or route coupling.
  Date/Author: 2026-09-01 / user and Codex.

- Decision: select content with `locale=nb|en`, default Norwegian, and retain
  the website's Norwegian fallback.
  Rationale: external consumers can reproduce both public locales without
  receiving duplicate language payloads.
  Date/Author: 2026-09-01 / user and Codex.

- Decision: collection responses contain card/calendar summaries and the slug
  detail endpoint contains complete content, including rich and plain-text
  descriptions.
  Rationale: the common calendar request remains compact while no public event
  information is inaccessible through the API.
  Date/Author: 2026-09-01 / user and Codex.

- Decision: a request without `from`/`to` returns the complete today-forward
  materialized set without pagination; an explicit range uses fixed pages of
  100 and an opaque cursor.
  Rationale: the default matches the current website's upstream bound, while
  deliberate historical or broad synchronization is bounded on the wire.
  Date/Author: 2026-09-01 / user and Codex.

- Decision: allow anonymous cross-origin access and an undocumented
  `includeInternal=true` option.
  Rationale: public content requires no partner onboarding; the hidden option
  is explicitly a convenience and not a security boundary. It must not appear
  in OpenAPI or the integration guide.
  Date/Author: 2026-09-01 / user and Codex.

- Decision: parent overview details return their ordered child occurrences;
  child occurrences link to a parent summary.
  Rationale: the API preserves series/festival navigation without nesting
  parent graphs in the chronological collection.
  Date/Author: 2026-09-01 / user and Codex.

- Decision: never invent `Kvarteret` as the location of an occurrence whose
  resolved location is missing. Keep its v1 location as `null`, keep it in the
  DataFeed with the Event location omitted, and allow detail-page JSON-LD to
  omit an ineligible occurrence.
  Rationale: API/feed completeness and search rich-result eligibility are
  different concerns, and inaccurate metadata is worse than an omitted field
  or node.
  Date/Author: 2026-09-01 / user and Codex.

- Decision: publish both OpenAPI and a prose integration guide, with slug-based
  detail routes and opaque ids in response bodies.
  Rationale: humans and generated clients get a supported contract while URLs
  align with existing public event slugs.
  Date/Author: 2026-09-01 / user and Codex.

- Decision: land the v1 API on a branch based on `origin/develop`, with its own
  published Sanity projection and compatibility-independent server service.
  Rationale: the checked-out branch carried unrelated PostHog commits, while
  the calendar implementation required by this plan is already in
  `origin/develop`. An isolated branch keeps the API PR reviewable and lets
  website migrations follow as separate commits without mixing unrelated work.
  Date/Author: 2026-09-01 / Codex.

- Decision: paginate explicit ranges in the API service result and bind the
  cursor to the normalized request rather than exposing Sanity query details.
  Rationale: this preserves a stateless opaque cursor and complete `total`
  count with the current public event volume. The route can later replace the
  internal retrieval strategy without changing the v1 envelope or cursor
  semantics.
  Date/Author: 2026-09-01 / Codex.

- Decision: retain the undocumented `includeInternal=true` option while
  removing the old website event query/fetch compatibility layer.
  Rationale: the user explicitly retained the internal-event convenience, but
  the migrated pages no longer need a parallel public-event normalization path.
  Date/Author: 2026-09-02 / user and Codex.

## Outcomes & Retrospective

The v1 API, shared website event reads, normalized detail JSON-LD, and
occurrence-first DataFeed are implemented locally and covered by the full
workspace test/typecheck/lint/build cycle. The obsolete website compatibility
queries/fetchers have now been removed so pages, APIs, and feeds converge on
the same public event domain. The repository now includes
source-backed ownership docs, staged-release machine-readable smoke checks,
and a report-only/release-gate Broadcast readiness audit. The current live
content audit is intentionally red until editors supply the missing event
data. Production firewall verification, the production-log check, and external
Broadcast venue/tag mapping and test import remain. Update this section after
each completed milestone with observable behavior, remaining gaps, and any
contract adjustment. At final completion, record the deployed URLs,
verification commands, DataFeed shape, whether Vercel protection was
successfully removed from both public machine-readable paths, and Broadcast's
confirmed mapping/readiness result.

## Context and Orientation

The repository is an npm workspace. `apps/studio` owns the Sanity arrangement
schema and editor behavior. `apps/web` owns public GROQ queries, normalization,
React pages, and Next.js route handlers. `packages/content-domain` contains the
pure `resolveEventContent` and `resolveEffectiveStatus` functions used to
inherit parent fields and combine status. Sanity Content Lake remains the only
public arrangement source; no sibling repository becomes part of this API.

ADR 005 materializes recurring series and festival programs as arrangement
documents. A `seriesParent` or `festivalParent` is an overview. A
`seriesInstance` or `festivalSession` is a concrete child with its own slug and
date. `single` covers ordinary events and may still have several stored date
entries. Normal listing queries select `single`, `seriesInstance`, and
`festivalSession`, treating missing `eventKind` as `single` for legacy safety.

The key current source files are:

- `apps/web/src/lib/sanity/queries/events.ts`, which defines the compatibility
  list/detail queries and the shared published API projections;
- `apps/web/src/features/events/server/public-events.ts` and
  `apps/web/src/features/events/domain/public-events.ts`, which resolve child
  inheritance, effective status, display defaults, dates, festival image
  behavior, parent summaries, and normalized occurrences;
- `apps/web/src/lib/sanity/fetch/events.ts`, which keeps the website fetch API
  compatible and preserves its draft-mode path;
- `packages/content-domain/resolve-event.ts`, the pure inheritance/status
  contract;
- `apps/web/src/app/[locale]/arrangementer/page.tsx`, the card-list server
  route;
- `apps/web/src/app/[locale]/arrangementer/kalender/page.tsx` and
  `apps/web/src/features/events/domain/calendar.ts` on current `develop`, the
  calendar route and occurrence grouping;
- `apps/web/src/app/[locale]/arrangementer/[event]/page.tsx`, full detail and
  parent program rendering;
- `apps/web/src/app/api/events/feed/route.ts` and
  `apps/web/src/lib/structured-data.ts`, the standalone JSON-LD route to change
  to DataFeed and the detail-page structured-data builder to retain;
- `apps/web/src/app/[locale]/arrangementer/page.tsx`, which currently advertises
  `/api/events/feed` as an `application/ld+json` alternate and will continue to
  do so;
- `apps/web/src/app/sitemap.ts`, which already publishes localized event detail
  URLs for crawler discovery.

There is no iCalendar route in the working source or `origin/develop`. Any
future calendar-subscription representation is outside this plan. The stale
`app/api/ical/route.ts` references in the repository guidance have been
corrected; do not treat iCalendar as an existing public boundary.

Broadcast is an external SaaS consumer, not a repository dependency and not a
content source. Its current input contract is documented at
`https://docs.broadcast.events/event-data`. It can poll a remote JSON endpoint
and map arbitrary structures, but prefers the fields `name`, `startTime`,
`endTime`, `venueId`, `published`, `tags`, and `pic`. Times must be ISO 8601 UTC
with a `Z` suffix. Optional values include price/cover text, free-entry state,
ticket link, sold-out state, and last-updated time. The Broadcast venue id and
tag vocabulary are external onboarding inputs that do not exist in current
repository source.

The June 2026 correspondence sets the first business scope as ticketed events,
with recurrence already unfolded into verified dates. It proposed ticket URL
as an idempotency key, but current data disproves that assumption. The shared
occurrence id is the stable performance identity; `ticketUrl` is a mutable
commerce link. Broadcast must confirm this mapping before launch. The later
webhook/two-way-sync idea is a stretch goal outside the initial pull delivery.

The checked-out `develop` is behind the calendar commits. Before implementation,
work from the latest `origin/develop` or a newly updated local `develop`. Do not
delete or overwrite the existing untracked
`.agents/execplans/021-durable-crescat-booking-promotion-continuation.md`; it is
unrelated user work.

An occurrence is the new normalized public unit. It pairs one resolved event
with one stored date entry. It has an opaque id and schedule. The public API
must not expose approval status, submission contact fields, booking provenance,
promotion controls, recurrence rules, or other editorial/administrative data.
It does expose event kind and parent identity because clients need those public
relationships to reproduce list and calendar behavior.

## Plan of Work

### Milestone 1: Establish the shared event and occurrence domain

Create a server-only module under `apps/web/src/features/events/server/` (use
`public-events.ts` unless current `develop` establishes a more specific server
folder convention) and pure occurrence helpers under
`apps/web/src/features/events/domain/`. Do not move Sanity clients into browser
code.

Refactor the shared event projection in
`apps/web/src/lib/sanity/queries/events.ts` so one parameterized public query
can select approved concrete records whose dates overlap an inclusive range.
It must accept nullable `$from`, nullable `$to`, `$locale`, and
`$includeInternal`. Use the ADR 005 legacy filter
`coalesce(eventKind, "single")`. Apply internal visibility with the inherited
value: include a row when `$includeInternal == true` or
`coalesce(isInternalEvent, parentEvent->isInternalEvent, false) != true`.

Project all fields needed by the website and public API, including `_id`,
`_updatedAt`, kind/status, slug, dates, room details, localized public content,
taxonomy, organizer, pricing, public links, festival-image control, and the
parent fields needed by `resolveEventContent`, including the parent's
`_updatedAt`. Keep editorial/submission and booking fields out. Use a separate
approved-by-slug query for detail, and a separate approved-children query for
parent programs, but reuse the same projection and resolver. Derive an
effective modification timestamp as the later of child and inherited parent
timestamps so a DataFeedItem changes when inherited public content changes.

Move the current `resolveArrangement` behavior into the shared boundary. It
must preserve these invariants: child fields fall back to parent fields;
location never inherits; a festival session with `useFestivalImage=false` does
not inherit the festival image; effective status combines child and parent;
missing display title uses the existing placeholder; and date/time values are
Stega-clean before domain logic. Preview code may retain Stega display values,
but public API results must be non-Stega published data.

Define a pure occurrence flattener. Give it resolved event records and an
inclusive range and return one item per matching date. Its ordering key is
`startDate`, `startTime ?? "99:99"`, event `_id`, and date `_key`. The opaque
occurrence id is derived from event `_id` and date `_key`, but callers are told
only to compare/store the complete string, never parse it.

Define schedule normalization with this behavior:

    startDate: stored YYYY-MM-DD
    startTime: stored HH:MM or null
    endDate: null without endTime; otherwise startDate or the next date when
             endTime is earlier than startTime
    endTime: stored HH:MM or null
    startsAt: UTC ISO 8601 timestamp with Z suffix when startTime exists, else null
    endsAt: UTC ISO 8601 timestamp with Z suffix when both a usable start and
            end time exist, else null
    timeZone: "Europe/Oslo"

Use `TZDate` from `@date-fns/tz`, already installed. Date-only does not mean
all-day, so do not introduce an `allDay: true` flag for a missing time. Build
the instant in Europe/Oslo and serialize it with `toISOString()` so Broadcast
receives the required UTC `Z` form while API clients retain the original local
date/time fields and IANA time zone.

Expose a function shaped like:

    type PublicEventSetOptions = {
      locale: AppLocale
      from: string | null
      to: string | null
      includeInternal?: boolean
    }

    async function fetchPublicEventSet(
      options: PublicEventSetOptions,
    ): Promise<{
      events: PublicEvent[]
      occurrences: PublicOccurrence[]
    }>

Move homepage, list, calendar, detail, sitemap, API, and feed consumers directly
onto the shared service. Detail fetching defaults to public visibility but
allows draft/Presentation preview to bypass it. Keep the explicit internal
option available only through the new API request boundary; do not read URL
search parameters inside the domain service.

At the end of this milestone, run TypeGen and focused tests. Acceptance is that
a fixture containing a multi-date single, two series children, festival child
with image override, parent cancellation, missing location, and internal child
produces the expected resolved events and globally ordered occurrences without
React or HTTP.

### Milestone 2: Migrate website consumers and implement the DataFeed

Update the current arrangement list and homepage through the shared service,
keeping their today-forward behavior. Ensure the latest
`/arrangementer` implementation still calls `filterToFirstInstances` after the
shared fetch, so only the first visible child per parent reaches the card list.

Change the calendar server route to call the shared service with the Monday of
the current Europe/Oslo week. Prefer passing the already flattened occurrences
into calendar grouping. If retaining the existing event-array component API is
less disruptive, add a pure adapter that groups occurrences back by event;
there must still be only one normalization and range-selection implementation.
Calendar month/day sorting must consume the shared stable occurrence order.

Update normal public detail lookup to exclude internal events. Preserve editor
Preview/Draft Mode access to internal content. A parent detail continues to
list approved children, filtered by public visibility outside preview.

Refactor `apps/web/src/lib/structured-data.ts` so detail-page JSON-LD node
construction accepts normalized occurrences rather than independently
interpreting an event's dates. Use normalized `startsAt` and `endsAt`, which
fixes midnight crossing and Oslo DST offsets. For a single-date event or
materialized child, the JSON-LD `@id` may be its canonical web URL. For a
multi-date single, retain a stable occurrence fragment so its nodes have
distinct ids. Keep current Schema.org status and offer behavior.

Structured data must describe visible content truthfully. Preserve the
detail-page behavior of omitting an Event node when an accurate location cannot
be built; do not assign `Kvarteret` merely to satisfy rich-result eligibility.
The shared event and occurrence remain present in the website and v1 API with a
null location. Add a test proving this deliberate divergence.

Replace `buildEventFeedData` in `apps/web/src/lib/structured-data.ts` with a
DataFeed serializer that accepts the shared default occurrence set. The root
has `@context: "https://schema.org"`, `@type: "DataFeed"`, a stable `@id`,
`url` pointing to `/api/events/feed`, a human-readable name,
`inLanguage: "nb"`, and `dataFeedElement`. Each element has
`@type: "DataFeedItem"`, an absolute `@id` under the feed URL derived from the
opaque occurrence id, an optional effective `dateModified`, and `item`
containing the Schema.org Event node. The DataFeedItem `@id` and wrapped Event
`@id` must be distinct so JSON-LD processors do not merge the feed entry and
event into one node.

The DataFeed serializer differs deliberately from the detail-page eligibility
builder: every public occurrence becomes a `DataFeedItem`. When location is
missing, the wrapped Event omits `location` but remains present. Use the same
canonical Event occurrence ids, effective status, normalized timestamps, and
offers as the detail builder. Derive each feed-entry id deterministically from
the API occurrence id. Do not add `ListItem`, `position`,
`numberOfItems`, or a non-standard recurrence rule. Array order follows the
shared global occurrence order as a stable delivery convenience, but clients
use occurrence ids and dates rather than treating Schema.org as the versioned
ordering contract.

Make the standard Event nodes sufficient for Broadcast mapping without adding
proprietary keys. `startDate` and `endDate` use normalized UTC timestamps with a
`Z` suffix. `keywords` contains the resolved taxonomy group and event type,
deduplicated, with empty labels removed, and capped at three. `image` is the
resolved public image URL. `isAccessibleForFree` and an array of named `Offer`
entries represent free entry, ordinary/student/member prices, currency, and
the ticket URL without discarding price variants. Omit sold-out state because
Sanity has no source field. `eventStatus` carries scheduled or cancelled state.

For a referenced Kvarteret room, preserve the canonical room Place and its
`containedInPlace` relationship to the site's canonical Kvarteret Place `@id`.
That stable containing-place id is what Broadcast should map to its venue id;
do not embed an unverified Broadcast identifier. A free-text or missing venue
cannot be declared Broadcast-ready until Broadcast and Samfunnet agree on a
stable mapping.

Update `apps/web/src/app/api/events/feed/route.ts` to use the shared public
service rather than `feedEventsQuery`, then remove that feed-only GROQ query
when no callers remain. Preserve `application/ld+json; charset=utf-8`, use the
same 60-second shared-cache lifetime as v1, and keep the arrangement page's
alternate link. Do not remove detail-page `JsonLd`, organization/website
structured data, or event paths from `apps/web/src/app/sitemap.ts`.

Before the production deployment, inspect the available Vercel request logs
for `/api/events/feed` and record the query window and result in Surprises &
Discoveries. Repository search has found no consumer, but logs are the final
check for an unknown external client. If a real non-crawler client appears,
deploy `/api/v1` first and communicate the breaking ItemList-to-DataFeed shape
change before changing the route.

Acceptance is that detail-page JSON-LD uses normalized schedule values, an
overnight fixture has `endDate > startDate`, and missing truthful location
omits only the detail-page JSON-LD node. The same occurrence remains in the v1
domain result and the DataFeed. The feed root is `DataFeed`, every member is a
`DataFeedItem` wrapping an Event, no `ItemList`/`ListItem` remains, the
arrangement listing still advertises the route, and the sitemap still contains
event detail URLs.

### Milestone 3: Implement the versioned collection and detail contracts

Create API response schemas and serializers under
`apps/web/src/features/events/api/`. Use Zod 4 schemas as runtime output
contracts and derive TypeScript types with `z.infer`. Serialization must be a
pure operation from shared domain records; do not return raw generated Sanity
query types.

Define the collection response as:

    {
      data: PublicOccurrenceSummary[]
      meta: {
        locale: "nb" | "en"
        from: string
        to: string | null
        count: number
        total: number
        paginated: boolean
      }
      links: {
        self: string
        next: string | null
      }
    }

`PublicOccurrenceSummary` contains `id`, `schedule`, and `event`. Its event
summary contains `id`, `slug`, `kind`, effective `status`, localized `title`,
optional `image` (`url`, `caption`), optional event type and taxonomy group,
organizer as either a referenced group or free-text value, location as either
a referenced room or free-text value, optional parent summary, and only its
API/web self links. It omits full description, separate pricing, ticket URL,
and Facebook URL; those belong to detail.

The detail response uses the same envelope style with one event in `data`. Add
`description: { blocks, text }`, pricing with `currency: "NOK"` and separate
ordinary/student/member nullable amounts, all public links, and ordered
occurrences. Parent occurrences use child event summaries, thereby providing
the same program links as the HTML parent detail page. Keep a real missing
location as `null`.

Create `apps/web/src/app/api/v1/events/route.ts` and
`apps/web/src/app/api/v1/events/[slug]/route.ts`. Validate locale and dates with
Zod. Dates are strict `YYYY-MM-DD` calendar dates and the inclusive start must
not be after the inclusive end. Invalid input returns:

    {
      "error": {
        "code": "invalid_request",
        "message": "A stable human-readable explanation"
      }
    }

with HTTP 400. Missing or hidden detail returns the same not-found envelope
with `code: "not_found"` and HTTP 404. Do not expose Sanity errors or GROQ in
responses.

If neither `from` nor `to` is supplied, set `from` to Oslo today, leave `to`
null, return all matches, and reject a `cursor` as invalid because the default
mode is unpaginated. If either date bound is explicitly present, set a fixed
page size of 100. The cursor encodes the last occurrence ordering key and a
fingerprint of locale, normalized range, and internal setting. Use base64url
JSON plus strict Zod decoding; it is opaque, not secret. The next link preserves
all documented parameters and appends the cursor. A changed parameter/cursor
combination returns HTTP 400. `total` is the total range match and `count` is
the current response count.

Recognize `includeInternal=true` in collection and detail parsing, but keep the
parser/helper separately named as an internal compatibility switch and do not
include it in exported documentation metadata. Any other value behaves as
false. Do not put `isInternalEvent` or approval state into the response.

Add shared CORS/response helpers for v1 routes. Successful and error responses
must include `Access-Control-Allow-Origin: *` and an explicit allowed-methods
and allowed-headers policy appropriate for read-only JSON. Implement OPTIONS
without Sanity access. GET and generated HEAD responses use
`Content-Type: application/json; charset=utf-8` and
`Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.

Build absolute API and website links through `resolveSiteUrl()` and the selected
locale. Never trust request Host to construct canonical links. Ensure local
execution still produces localhost links when no deployment URL is configured.

Acceptance is route-level tests covering both locales, no-bound unpaginated
mode, explicit-range 100-item pagination and next traversal, invalid dates,
cursor mismatch, internal default/opt-in, historical detail, parent detail,
CORS/OPTIONS, errors, and output-schema parsing.

### Milestone 4: Publish the contract and deployment boundary

Create `apps/web/src/app/api/v1/openapi.json/route.ts`. Compose an OpenAPI 3.1
document with servers based on the canonical production origin, documented
collection/detail query parameters, response examples, errors, and response
components derived from the Zod schemas through `z.toJSONSchema`. Hand-author
only the OpenAPI paths and metadata Zod cannot express. Add a test that parses
the document, asserts both route paths, and validates its component generation.
Do not document `includeInternal`.

Write `docs/reference/events-api.md` as the external integration guide. Explain
the occurrence model, locale fallback, default range, explicit-range cursor
behavior, parent/detail traversal, date-only versus timed schedules, overnight
end dates, cache expectations, error envelopes, and example curl calls. State
that ids are opaque and that breaking changes move to v2. Do not mention the
hidden internal option.

Update `docs/repo-interactions.md`, `.agents/README.md`, and the repository's
arrangement skill boundary so they name the shared service and v1 routes as
Sanity-backed public consumers. Remove the stale `app/api/ical/route.ts`
reference because that route does not exist in current source. Update the feed
boundary to name Schema.org DataFeed and make clear that it is a lossy
projection of the same public occurrence service. Record owner as
`samfunnetibergen/apps/web`, content owner as Sanity, and external consumers as
anonymous clients plus the named Broadcast ingestion mapper, with no
sibling-repository dependency.

In `docs/reference/events-api.md`, explain that Event JSON-LD is embedded on
website detail pages for search metadata and that `/api/events/feed` is an
optional DataFeed linked-data representation. State that neither replaces the
complete v1 contract and that no calendar-subscription endpoint is currently
supported. Do not suggest that clients scrape page JSON-LD, expand recurrence
rules, or treat a future iCalendar representation as a full-detail API.

Update the production release smoke paths or add a focused post-deploy API
smoke step that requests `/api/v1/events`, `/api/v1/openapi.json`, and
`/api/events/feed` without the Vercel automation bypass header. The web Vercel
project owner must add a firewall/protection exception for `/api/v1/*` and
`/api/events/feed`. This dashboard change cannot be implemented by CORS or
`apps/web/vercel.json`; document it in the deployment/integration guide and do
not call rollout complete until an ordinary external curl returns 200.

Acceptance is that a developer with no repository access can fetch OpenAPI,
call the documented API cross-origin, traverse an event's detail/parent links,
and receive no security checkpoint. The public arrangement page advertises the
DataFeed, `/api/events/feed` returns a Schema.org DataFeed without an
ItemList/ListItem wrapper, and an event detail page still embeds accurate Event
JSON-LD.

### Milestone 5: Validate and hand off the Broadcast ingestion feed

Create `apps/web/src/features/events/integrations/broadcast-readiness.ts` as a
pure diagnostic adapter over `PublicOccurrence`. It does not serialize a new
public response. It selects occurrences with an effective ticket URL and
reports stable machine-readable issue codes for missing title, start time, end
time, image, taxonomy keyword, ticket URL, and mappable location. It also
reports duplicate ticket URLs as information, not as duplicate occurrences,
because occurrence id is the match key.

Create `apps/web/scripts/audit-broadcast-readiness.ts` and a web workspace
script named `events:audit:broadcast`. The script reads published Sanity data
through the shared service, evaluates all today-forward ticketed occurrences,
and prints aggregate counts plus a concise list of occurrence ids, website
links, and issue codes. It must not print Portable Text bodies, unpublished
content, submission contact details, credentials, or full ticket URLs. Exit
nonzero while any ticketed candidate has a local readiness error, with an
explicit flag for a non-blocking report during initial remediation.

Add fixture tests for a ready ticketed occurrence, shared ticket URL across two
occurrences, missing end time, missing image, missing taxonomy, free-text
location, cancellation, and inherited parent fields. Prove that the same
ticket URL never collapses occurrence ids and that UTC output ends after it
starts across midnight and daylight-saving boundaries.

Complete an onboarding checklist with Broadcast and record the answers in
`docs/reference/events-api.md`: the exact DataFeed URL; DataFeedItem id as the
stable external match key; mapping from canonical Kvarteret Place `@id` and
room relationship to Broadcast venue id; accepted tag translation; whether
the full snapshot is limited to ticketed items in their mapper; cancellation
and disappearance semantics; poll cadence; cache expectations; and a safe test
workspace/contact. External ids supplied by Broadcast are configuration or
documented mapper inputs, not guessed constants.

Run the readiness audit against current production content and give editors the
result. The historical audit found 22 of 34 ticketed occurrences locally ready;
that count is context only. Do not claim onboarding complete until a fresh
report has no local errors for the agreed scope or Broadcast explicitly accepts
the remaining records as drafts.

Hand Broadcast the public DataFeed URL only after the Vercel security checkpoint
is removed. Ask Broadcast to import into a test workspace and verify at least
one normal ticketed event, two occurrences sharing a ticket URL, an overnight
event, a free event when present, a Kvarteret room, and a cancelled event. For
each, compare Broadcast's title, UTC times, image, tag, venue, ticket link, and
status with `/api/v1/events/{slug}` and the website.

Acceptance is a written mapping agreement, a saved readiness transcript, and a
successful Broadcast test import with stable updates: changing an occurrence's
time updates the same Broadcast record, two performances sharing a ticket URL
remain separate, cancellation is reflected without deletion ambiguity, and no
private/editorial fields leave Samfunnet. Webhook work remains unstarted and is
not required for this milestone.

## Concrete Steps

Run all repository commands from
`/Users/kluvin/dev/kvarteret/samfunnetibergen`. Before implementation, inspect
and preserve the current state:

    git status --short --branch
    git log --oneline --decorate HEAD..origin/develop

Do not reset the current dirty checkout. Prefer a clean branch/worktree from
the latest `origin/develop` if reconciling the current ahead/behind history
would overlap unrelated work. The branch must contain the event calendar
commits before editing.

After the query and projection change, regenerate rather than hand-edit Sanity
types:

    mise exec node@24 -- npm run sanity:typegen

Review the generated diffs in both:

    apps/web/src/lib/sanity/sanity.types.ts
    apps/studio/src/studio/sanity.types.ts

After Milestone 1, run focused domain/query tests and type checking:

    mise exec node@24 -- npm run test:web -- --run src/features/events src/lib/sanity
    mise exec node@24 -- npm run test:domain
    mise exec node@24 -- npm run typecheck

After route and documentation implementation, run the full relevant cycle:

    mise exec node@24 -- npm test
    mise exec node@24 -- npm run typecheck
    mise exec node@24 -- npm run lint:web
    mise exec node@24 -- npm run format:check
    mise exec node@24 -- npm run build:web

Run the Broadcast readiness report without blocking while editors remediate the
first dataset, then without the flag for the release gate:

    mise exec node@24 -- npm --workspace @samfunnet/web run events:audit:broadcast -- --report-only
    mise exec node@24 -- npm --workspace @samfunnet/web run events:audit:broadcast

The report-only command must print total ticketed occurrences, ready count,
issue counts, and safe occurrence references. The release-gate command exits
zero only when the agreed visible scope is locally complete.

Start the site for manual verification:

    mise exec node@24 -- npm run dev:web

In another terminal, use a fixed test date only in automated fixtures. Manual
local requests use the actual Oslo date:

    curl -i 'http://localhost:3187/api/v1/events?locale=nb'
    curl -i 'http://localhost:3187/api/v1/events?locale=en&from=2026-09-01&to=2027-02-28'
    curl -i 'http://localhost:3187/api/v1/events/<known-slug>?locale=nb'
    curl -i 'http://localhost:3187/api/v1/openapi.json'
    curl -i 'http://localhost:3187/api/events/feed'
    curl -s 'http://localhost:3187/nb/arrangementer' \
      | rg 'api/events/feed|application/ld\+json'
    curl -s 'http://localhost:3187/nb/arrangementer/<known-slug>' \
      | rg 'application/ld\+json|schema.org'
    curl -i -X OPTIONS -H 'Origin: https://example.org' \
      'http://localhost:3187/api/v1/events'

The feed request must return 200 with `application/ld+json`; `jq -r '."@type"'`
must print `DataFeed`, and every `.dataFeedElement[]."@type"` must be
`DataFeedItem`. The arrangement listing must still contain the feed URL. The
known event detail page must still contain a Schema.org Event JSON-LD script
when that event has the required truthful fields.

Inspect the Broadcast-mappable subset without treating ticket links as ids:

    curl -s 'http://localhost:3187/api/events/feed' \
      | jq '[.dataFeedElement[]
        | select(any((.item.offers | if type == "array" then .[] else . end); .url != null))
        | {
          id: ."@id",
          name: .item.name,
          start: .item.startDate,
          end: .item.endDate,
          tags: .item.keywords,
          image: .item.image,
          place: .item.location
        }]'

Every returned id is distinct even when offers URLs repeat. Timed values end in
`Z`, end follows start, keywords contain one to three non-empty values for ready
records, and Kvarteret rooms retain their canonical containing-place identity.

Use `jq` to inspect ordering and relationships:

    curl -s 'http://localhost:3187/api/v1/events?locale=nb' \
      | jq -r '.data[] | [.schedule.startDate, .schedule.startTime, .event.title, (.event.parent.title // "-")] | @tsv'

The dates must be ascending globally. Current production counts are not an
acceptance assertion because editors can change Sanity while implementation is
in progress.

After deployment and the Vercel exception, run the v1 collection, detail,
OpenAPI, and DataFeed requests against `https://www.samfunnetibergen.no` without
`x-vercel-protection-bypass`. Expect HTTP 200 with the documented JSON or
JSON-LD content types and no HTML checkpoint body.

## Validation and Acceptance

The implementation is accepted only when all of the following behavior is
demonstrable.

A default Norwegian collection request returns every approved, non-internal
concrete occurrence from Oslo today onward in one response. It includes all
materialized Quiz-like series instances, every festival session, and every
date of a multi-date single. Location may be null. Its `meta.paginated` is
false and `links.next` is null.

An English request chooses English public content and falls back field-by-field
to Norwegian exactly as the website does. It does not return localized arrays
or both languages.

An explicit range containing more than 100 fixture occurrences returns 100,
`meta.paginated: true`, the complete range total, and a next link. Following
next links returns every occurrence exactly once in the same stable order. A
cursor reused with another locale, date range, or internal setting returns 400.

A detail request returns rich blocks and equivalent plain text, complete
prices/links, and occurrence schedules. A series/festival parent returns its
ordered child occurrence program; a child returns its parent summary. Approved
historical details remain reachable. Unapproved or normally hidden internal
details return 404.

The website list still collapses later instances under one parent. The calendar
shows every current-week-and-future occurrence. Homepage/list/calendar/detail
and API serializers obtain resolved records from the same service, with no
second feed-only inheritance implementation.

An eligible event detail page embeds Schema.org Event JSON-LD built from the
same normalized occurrence schedule. An occurrence from 21:00 to 02:30 has an
end timestamp on the next date. JSON-LD remains safe to embed (`<` is escaped)
and uses effective Schema.org status. An occurrence with no truthful location
is returned by `/api/v1/events` with `location: null` and appears in the
DataFeed with `item.location` absent, while its detail page omits the ineligible
Event node instead of fabricating `Kvarteret`.

`/api/events/feed` has a DataFeed root and one DataFeedItem per default public
API occurrence in the same global order. Its wrapped Event nodes use the same
occurrence identities and normalized schedules. `/arrangementer` advertises it,
event detail URLs remain present in the sitemap, and no `ItemList`, `ListItem`,
RSS, Atom, JSON Feed, or iCalendar representation is introduced by this plan.

Every locally ready ticketed occurrence exposes a distinct DataFeedItem id,
UTC `Z` start/end values, one to three taxonomy-derived keywords, a public
image, ticket offer, effective modification time, and a canonical Place
identity that Broadcast can map. Repeated ticket URLs do not collapse records.
The readiness audit identifies incomplete candidates without printing private
or sensitive values and exits nonzero in release-gate mode.

Broadcast has confirmed in writing how it maps occurrence identity, venue,
tags, cancellation, disappearance, and polling. A test-workspace import proves
normal updates replace the same external record, shared ticket URLs stay
separate, and cancellations remain explicit. This pull-feed acceptance is
required; webhook or two-way synchronization is not.

All v1 success and error responses satisfy their Zod schemas and carry CORS and
cache headers. OPTIONS succeeds without querying Sanity. OpenAPI describes the
documented behavior but contains no `includeInternal` parameter.

`npm run sanity:typegen`, full tests, TypeScript checking, web lint, formatting,
and the production web build all pass. Generated type diffs correspond only to
the intended GROQ contract changes.

Finally, unauthenticated production requests from outside Vercel return 200 for
the v1 collection, OpenAPI, and DataFeed. A result that works only with the
automation bypass header is not complete.

## Idempotence and Recovery

The query, normalization, serialization, and route work is code-only; it does
not write or migrate Sanity documents. TypeGen can be rerun safely and should
be rerun after every query-shape adjustment. Never edit generated Sanity type
files manually.

Keep compatibility wrappers until every existing website caller passes tests.
This permits an incremental migration: add the shared service, prove its output,
move one website consumer at a time, and delete the reduced `feedEventsQuery`
only after the DataFeed route uses the shared service. Keep the route and
listing alternate. If a consumer migration fails, restore that caller to the
wrapper while keeping the tested service; do not fork a second resolver.

The ItemList-to-DataFeed change is reversible from version control during
development. If the production-log check identifies a real consumer, deploy v1
first and communicate the breaking shape change rather than maintaining two
feed formats indefinitely. No Sanity data is changed by either path.

Opaque cursors are stateless and require no database. Changing their encoding
during development invalidates only development links. Once v1 is deployed,
preserve the decoder for issued cursors through at least the response cache
window or add an explicit cursor version field.

The Vercel firewall exception is reversible independently of code. If it
cannot be safely enabled, do not claim the anonymous API is released; keep the
code deployed behind protection or delay promotion and record the blocker in
this plan. Do not work around protection by distributing the automation bypass
secret to API consumers.

No action in this plan should delete or rewrite the unrelated untracked
ExecPlan 021 or other user changes.

## Artifacts and Notes

The intended data flow is:

    Sanity published arrangement documents
      -> shared GROQ projection
      -> parent inheritance + effective status
      -> normalized PublicEvent records
      -> globally sorted PublicOccurrence records
           -> list adapter (first child per parent)
           -> calendar adapter (all occurrences from current-week Monday)
           -> /api/v1/events summary serializer
           -> /api/v1/events/{slug} detail serializer
           -> detail-page Schema.org JSON-LD serializer (eligible nodes only)
           -> Schema.org DataFeed serializer (every public occurrence)
                -> Broadcast mapper (ticketed occurrence subset)

The Broadcast handoff path is pull-based:

    DataFeedItem @id -> stable Broadcast event match key
    Schema.org Event -> Broadcast field mapping owned by Broadcast
    ticket URL -> purchase metadata, never identity
    readiness audit -> editorial repair list before import
    webhook delivery -> deferred separate decision

The representation boundary is:

    Search discovery: sitemap + Event JSON-LD on event detail HTML
    External application integration: versioned /api/v1 JSON
    Linked-data export: /api/events/feed as Schema.org DataFeed
    Calendar subscription/import: not implemented; separate future decision
    Schema.org ItemList representation: retired

The expected relationship shape is one level deep:

    seriesParent -> seriesInstance occurrences
    festivalParent -> festivalSession occurrences
    single -> its own one or more occurrences

Do not publish recurrence rules. Materialized children are the public schedule;
external consumers must not expand RRULE.

## Interfaces and Dependencies

Use existing dependencies only:

- `next-sanity` and the existing Sanity clients for published reads;
- `@samfunnet/content-domain` for inheritance and effective status;
- `@date-fns/tz` and `date-fns` for Europe/Oslo schedule normalization;
- Zod 4 for request validation, response schemas, inferred types, cursor
  decoding, and JSON Schema components;
- native Next.js 16 Route Handlers using `Request`/`Response` or
  `NextRequest` where URL parsing is clearer.

Do not add an API framework, OpenAPI generator dependency, database, API-key
store, or a second event query client.

In
`apps/web/src/features/events/integrations/broadcast-readiness.ts`, define a
pure diagnostic contract shaped like:

    type BroadcastReadinessIssueCode =
      | "missing_title"
      | "missing_start_time"
      | "missing_end_time"
      | "missing_image"
      | "missing_keyword"
      | "missing_ticket_url"
      | "unmapped_location"

    type BroadcastReadiness = {
      occurrenceId: string
      websiteUrl: string
      ready: boolean
      issues: BroadcastReadinessIssueCode[]
    }

    function assessBroadcastReadiness(
      occurrence: PublicOccurrence,
    ): BroadcastReadiness

The function reads only resolved public fields. It does not call Broadcast,
write Sanity, decide Broadcast's tag vocabulary, or treat duplicate ticket URLs
as duplicate events. The audit script groups and formats these pure results.

The stable public enums are:

    EventKind =
      | "single"
      | "seriesParent"
      | "seriesInstance"
      | "festivalParent"
      | "festivalSession"

    EventStatus = "scheduled" | "cancelled"
    Locale = "nb" | "en"

Use discriminated public shapes for organizer and location so consumers do not
guess whether a referenced record exists:

    Organizer =
      | { kind: "group"; id: string; name: string; slug: string }
      | { kind: "text"; name: string }
      | null

    Location =
      | {
          kind: "room"
          id: string
          name: string
          slug: string
          floor: number | null
          imageUrl: string | null
        }
      | { kind: "text"; name: string }
      | null

Prices are integer or decimal numbers already stored by Sanity; do not convert
them to formatted strings in the API. The detail pricing object carries
`currency: "NOK"`, `isFree`, and nullable `ordinary`, `student`, and `member`
amounts. UI-specific strings such as `Ord.` and `Gratis` remain presentation
translations, not API data.

Errors use one stable envelope and the codes `invalid_request`, `not_found`,
and `internal_error`. Log server diagnostics through existing observability,
but return only a stable public message and do not log entire Portable Text
payloads or Sanity credentials.

## Plan Revision Note

2026-09-01: Initial ExecPlan written after source, current `origin/develop`,
production Sanity, local feed reconstruction, and deployment-access inspection.
It records the user's decisions on versioning, occurrence semantics,
localization, summary/detail depth, range-dependent pagination, anonymous CORS,
undocumented internal visibility, linked parent graphs, OpenAPI, and slug
detail lookup.

2026-09-01: Revised after challenging whether the standalone JSON-LD feed had a
distinct purpose. Current search guidance, source evidence, and representation
semantics support detail-page Event JSON-LD plus the sitemap for discovery,
versioned JSON for complete integrations, and iCalendar only as a possible
future subscription format. The user chose to retain the linked-data endpoint
with the more accurate Schema.org DataFeed/DataFeedItem representation. The
plan now changes the feed shape, rejects a fabricated location fallback, adds a
production-log check for unknown consumers, and applies the Vercel exception to
both public machine-readable paths.

2026-09-01: Revised after the user identified Broadcast as the penultimate
delivery goal and supplied the June 2026 correspondence. Broadcast's current
documentation and a fresh Sanity audit exposed required UTC/time, image, tag,
venue, publication, and identity constraints. The plan now treats DataFeed as
the proposed Broadcast pull endpoint, rejects ticket URL as idempotency
identity, adds a non-mutating readiness audit and test-workspace handoff
milestone, and defers webhooks until pull reconciliation is proven.

2026-09-01: Updated during the first implementation slice. The API branch now
starts from `origin/develop`; the public Sanity projection, pure event and
occurrence domain, v1 collection/detail handlers, cursor contract, OpenAPI
route, integration guide, and focused tests are implemented. The plan records
the `@date-fns/tz` UTC conversion discovery and leaves website/DataFeed
migration, deployment, and Broadcast onboarding as remaining work.

2026-09-01: Updated after the consumer/feed slice. Website event reads and the
calendar now use the shared published occurrence service; detail JSON-LD and
`/api/events/feed` consume normalized occurrences, with the latter now a
`DataFeed`. Source-backed boundary docs and release smoke checks cover the
machine-readable paths. The Broadcast readiness adapter and safe audit are
implemented; external venue/tag mapping and production firewall verification
remain release prerequisites.

2026-09-02: Revised after the PR 123-125 cleanup review. The website
compatibility queries and fetchers are removed, the calendar consumes the
service's occurrence stream directly, API errors are explicitly non-cacheable,
OpenAPI schema generation matches the declared 3.1 dialect, and redundant
machine-endpoint status-only smoke requests are removed. The intentionally
undocumented `includeInternal=true` option remains by user decision.
