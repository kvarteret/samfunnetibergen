# Deliver one public occurrence API for mobile and Broadcast

This ExecPlan is a living document. Maintain its Progress, Surprises &
Discoveries, Decision Log, and Outcomes & Retrospective sections in accordance
with `.agents/PLANS.md`.

## Purpose / Big Picture

After this work, the mobile app and Broadcast can consume one anonymous,
versioned API at `/api/v1/events`. A single default request returns a compact,
complete snapshot of upcoming occurrences. Each item has enough public data for
Broadcast and mobile clients to map and display it without following another
URL, including a sanitized HTML/plain-text description. The detail endpoint
adds Facebook metadata and parent child-program relationships.

The old `/api/events/feed` route is removed. Individual website detail pages
continue to embed Schema.org Event JSON-LD for search metadata. Events with no
room and no explicit free-text location resolve to the venue `Det Akademiske
Kvarter` rather than appearing locationless.

## Progress

- [x] (2026-09-01) Implemented the shared published Sanity query, normalized
      occurrence domain, v1 collection/detail routes, OpenAPI, website consumer
      migration, and focused/full verification on the stacked PR branches.
- [x] (2026-09-01) Added the Broadcast readiness audit and production smoke
      checks.
- [x] (2026-09-02) Confirmed Broadcast accepts a remote JSON endpoint in any
      mappable structure and does not require Schema.org DataFeed.
- [x] (2026-09-02) Recorded the decision to use one versioned API, keep compact
      collection plus rich detail, omit batch detail, and remove the DataFeed.
- [x] (2026-09-02) Removed the DataFeed route, serializer, route tests,
      listing-page advertisement, and release smoke assertions.
- [x] (2026-09-02) Expanded the v1 collection schema with effective update time,
      pricing, ticket link, and the default venue location.
- [x] (2026-09-02) Updated Broadcast readiness so only explicit free-text
      locations require external mapping; a missing location resolves to Det
      Akademiske Kvarter.
- [x] (2026-09-02) Updated all current architecture/reference guidance and retired stale
      DataFeed claims while preserving historical ExecPlans as historical
      records.
- [x] (2026-09-02) Ran focused and full web tests, route TypeGen, formatting,
      typecheck, lint, production build, local HTTP smoke tests, the live
      report-only audit, and final diff checks. Exact results are recorded below.
- [x] (2026-09-02) Enabled and verified the production Vercel firewall bypass
      for `/api/v1/*`; unauthenticated requests now reach the application rather
      than the Vercel 429 Security Checkpoint.
- [x] (2026-09-02) Removed and published both project-wide Vercel rate-limit
      rules. Added the canonical `SITE_URL` to Preview and Production so API
      links no longer inherit the unrelated `blifrivillig.no` project domain.
- [x] (2026-09-02) Made missing ticket URLs informational rather than a
      readiness blocker and documented 23:00 as an explicit editorial estimate
      for evening concerts with no known end time.
- [x] (2026-09-02) Corrected the three affected concert end times and the BIFF
      2026 title, description, venues, and ticket-link semantics in published
      Sanity content with a revision-guarded transaction.
- [x] (2026-09-03) Verified the combined Vercel preview returns HTTP 200 with
      canonical API/OpenAPI links and the corrected concert schedules. Copied
      the BIFF multi-venue text onto all nine festival sessions because session
      locations intentionally do not inherit from their festival parent.
- [x] (2026-09-03) Simplified the v1 contract by removing cursor pagination,
      response-level links duplication, and raw Portable Text. Added a
      discriminated schedule, sanitized HTML/plain-text descriptions, ETag
      conditional responses, explicit anonymous OpenAPI operations, and
      unsupported-parameter rejection. Updated event consumers, tests, docs,
      and direct serializer dependencies.
- [x] (2026-09-03) Extended the production smoke check to assert ETag headers,
      conditional `304` behavior, discriminated schedule/description payloads,
      anonymous OpenAPI security, and GET/HEAD/OPTIONS documentation.
- [x] (2026-09-03) Completed local verification: 329 web tests passed with 5
      skipped, web TypeScript and ESLint passed, the production web build
      completed, formatting and `git diff --check` passed, OpenAPI validation
      completed without errors, and generated client types were produced.
- [x] (2026-09-03) Smoked the production build locally against the current
      published Sanity dataset: the 73-item snapshot contained both timed and
      date-only schedules, emitted sanitized HTML/plain text and an ETag,
      exposed ETag through CORS, and returned `304` for `If-None-Match`.
- [x] (2026-09-03) Re-ran the non-writing Broadcast source-data audit. It still
      reports the expected 29 of 39 ticketed occurrences ready, with nine BIFF
      date-only occurrences and ten external-location mappings outstanding.
- [ ] Before production, check request logs for unknown DataFeed consumers and
      complete a Broadcast test-workspace import.

## Surprises & Discoveries

- Observation: Broadcast accepts a remote JSON endpoint in any structure it can
  map.
  Evidence: `https://docs.broadcast.events/event-data` describes remote API
  feeds and explicitly says Broadcast maps arbitrary structures.

- Observation: ticket URLs are not occurrence identities.
  Evidence: the 2026-09-01 production audit found one ticket URL shared by nine
  upcoming occurrences. The opaque occurrence ID remains the match key.

- Observation: the original DataFeed provided no necessary search-discovery
  behavior.
  Evidence: event detail pages already embed Schema.org Event JSON-LD and the
  sitemap publishes their URLs.

- Observation: the requested missing-room behavior reverses the earlier
  assumption that a missing location must remain null.
  Evidence: the user clarified on 2026-09-02 that an event with no room may be
  considered located at Det Akademiske Kvarter itself. Explicit free-text
  locations remain authoritative.

- Observation: the requested Luna xhigh subagent could not execute its assigned
  API-contract slice.
  Evidence: the subagent returned a usage-limit error before making changes;
  the primary agent implemented and reviewed the slice directly.

- Observation: the live 429 was a Vercel system challenge rather than either
  configured arrangement-page rate-limit rule.
  Evidence: the response included `x-vercel-mitigated: challenge`; Attack Mode
  was off and both rate-limit rules matched only localized arrangement listing
  paths. Publishing the `Allow Public Events API` bypass for `/api/v1/` changed
  the response from a Vercel 429 to an ordinary application 404 before deploy.

- Observation: Vercel custom bypass rules do not permanently disable
  platform-level DDoS mitigation.
  Evidence: Vercel exposes only a 24-hour system-mitigation pause. The two
  project rate-limit rules were removed globally, while baseline system
  mitigations remain active.

- Observation: BIFF has published the festival dates and venues but not the
  2026 screening times.
  Evidence: `https://www.biff.no/article/biff-2026-1422-oktober` says BIFF runs
  14–22 October and that screening times become available when ticket sales
  open on 1 October. The content correction therefore retains date-only
  festival days instead of inventing times.

- Observation: locations intentionally do not inherit from festival parents.
  Evidence: the shared event resolver excludes room and free-text location
  fields from its inheritance allowlist. Setting only the BIFF parent venue
  therefore made child API occurrences fall back to Det Akademiske Kvarter;
  the same sourced multi-venue text had to be stored on each child session.

- Observation: `@portabletext/to-html` escapes text but returns raw component
  output, so it is not sufficient as the API boundary by itself.
  Evidence: the serializer now applies explicit component escaping and an
  `isomorphic-dompurify` tag, attribute, and URI allowlist; malicious-link and
  markup tests pass.

- Observation: changing the shared domain schedule requires website consumers
  to derive their local calendar date/time from UTC rather than reading removed
  split fields.
  Evidence: calendar, structured-data, and Broadcast readiness tests now pass
  against the `timed`/`date` union.

## Decision Log

- Decision: expose one external integration contract under `/api/v1` and remove
  `/api/events/feed`.
  Rationale: DataFeed duplicated serialization, tests, documentation, and
  deployment checks without being required by Broadcast or search discovery.
  Date/Author: 2026-09-02 / user and Codex.

- Decision: keep an integration-complete collection and a rich single-event
  detail resource.
  Rationale: Broadcast needs one polling response, but repeating Portable Text
  and child graphs for every occurrence would bloat the common list response.
  Date/Author: 2026-09-02 / user and Codex.

- Decision: do not add batch detail retrieval.
  Rationale: neither named consumer needs it; it would add batch limits,
  partial-failure semantics, cache variants, and duplicate rich content.
  Date/Author: 2026-09-02 / user and Codex.

- Decision: preserve the default unpaginated upcoming snapshot and return every
  occurrence matching inclusive `from`/`to` filters; remove cursor pagination.
  Rationale: current volume makes a complete snapshot practical and removing
  page state simplifies both integrations and the OpenAPI contract.
  Date/Author: 2026-09-03 / user and Codex; supersedes the 2026-09-02 page
  decision.

- Decision: keep the hidden `includeInternal=true` compatibility switch accepted
  by route parsing but omit it from OpenAPI and public reference documentation.
  Rationale: preserve the requested compatibility behavior without making the
  internal-event escape hatch part of the public contract.
  Date/Author: 2026-09-03 / user and Codex.

- Decision: expose schedules as `{kind:"timed", startsAt, endsAt, timeZone}` or
  `{kind:"date", date, timeZone}` and do not retain redundant local split
  fields in the API response.
  Rationale: a discriminator makes date-only versus timed semantics explicit;
  UTC timestamps preserve overnight behavior without ambiguous local fields.
  Date/Author: 2026-09-03 / user and Codex.

- Decision: serialize descriptions to sanitized `{html,text}` in collection
  summaries and never expose raw Portable Text blocks.
  Rationale: Broadcast/mobile consumers need description content without a
  detail round trip, and HTML/plain text is portable while a strict allowlist
  prevents editor content from becoming executable markup.
  Date/Author: 2026-09-03 / user and Codex.

- Decision: detail responses use `detailKind`; leaf occurrences contain only
  `{id,schedule}`, while parent occurrences contain child summaries without a
  repeated parent summary.
  Rationale: event fields occur once per detail resource while parent programs
  still expose child identity and content clearly.
  Date/Author: 2026-09-03 / user and Codex.

- Decision: add deterministic ETags and honor `If-None-Match` for collection and
  detail GET/HEAD responses.
  Rationale: complete snapshots are cheap to validate and unchanged polling
  should return `304` without a JSON body.
  Date/Author: 2026-09-03 / user and Codex.

- Decision: collection summaries include `updatedAt`, pricing, and ticket link
  in addition to their existing image, taxonomy, organizer, status, schedule,
  location, parent, and navigation fields.
  Rationale: Broadcast can map every locally controlled field without making
  one detail request per occurrence.
  Date/Author: 2026-09-02 / user and Codex.

- Decision: resolve public locations in the order referenced room, explicit
  free text, then the venue `Det Akademiske Kvarter`.
  Rationale: explicit editorial data must win, while a genuinely missing room
  means the event is located at the venue itself. The fallback has no invented
  Sanity room ID and is serialized as location kind `venue`.
  Date/Author: 2026-09-02 / user and Codex.

- Decision: use occurrence ID, not ticket URL, as the Broadcast match key.
  Rationale: performances may share a ticket page and ticket URLs may change.
  Date/Author: 2026-09-01 / user and Codex.

- Decision: missing ticket URLs are informational and do not block Broadcast
  readiness.
  Rationale: ticket-page availability and placement cannot be guaranteed. The
  API continues to expose a nullable ticket URL when one exists.
  Date/Author: 2026-09-02 / user and Codex.

- Decision: editors may enter 23:00 as the estimated end of an evening concert
  when no more precise time exists.
  Rationale: this resolves known concert records without making the API invent
  end times for other event categories.
  Date/Author: 2026-09-02 / user and Codex.

- Decision: keep page-level Schema.org Event JSON-LD and do not replace the
  removed feed with iCalendar, RSS, Atom, or JSON Feed.
  Rationale: structured page metadata and calendar subscription are different
  concerns from the supported application API.
  Date/Author: 2026-09-02 / user and Codex.

## Outcomes & Retrospective

The repository now exposes one public schema and one OpenAPI document for
mobile and Broadcast, with no standalone DataFeed. The local production server
returned 73 upcoming occurrences from `/api/v1/events?locale=nb`; a sample
contained `updatedAt`, location, pricing, and ticket link, and a live occurrence
without source location serialized as venue `Det Akademiske Kvarter`.
`/api/events/feed` returned 404 and was absent from the production build route
table.

Verification passed: 35 focused tests, the full web suite with 324 passed and 5
skipped, route TypeGen, web typecheck, web lint, repository format check,
production web build, and `git diff --check`. The report-only production-content
audit found 39 paid occurrences, with 22 ready; remaining gaps were 12 missing
end times, 9 missing start times, 4 missing ticket URLs, and 1 explicit
free-text location awaiting mapping. The report exited successfully as
designed. No Sanity schema or GROQ query shape changed, so Sanity TypeGen was
not rerun.

Repository implementation is complete and the path-scoped Vercel firewall
bypass is live. Remaining external work is the request-log check for unknown
legacy feed consumers, Broadcast mapping agreement, test-workspace import, and
production deployment.

The follow-up correction removed both Vercel rate-limit rules, configured the
canonical site origin for deployments, made ticket URLs optional for readiness,
and updated published concert and BIFF content. The refreshed audit found 39
paid occurrences with 29 ready. The remaining blockers are nine date-only BIFF
days, external mapping for the BIFF multi-venue label, and one Akvariet venue
mapping; missing ticket links are informational. BIFF remains date-only until
its screening timetable is published on 1 October; this is accurate source
data, not an integration defect. The deployed preview returns all nine BIFF
occurrences with their sourced multi-venue text rather than the default venue.

The 2026-09-03 contract simplification is implemented and locally verified.
All 329 active web tests, web TypeScript, ESLint, production build, formatting,
diff checks, OpenAPI validation, and client type generation pass. The Broadcast
audit result remains 29 of 39 ticketed occurrences ready; the known BIFF time
and external-location mapping gaps remain content/partner work. Only the
external request-log and Broadcast test-workspace steps remain.

## Context and Orientation

This is an npm workspace. `apps/studio` owns Sanity arrangement schemas.
`apps/web/src/lib/sanity/queries/events.ts` selects published fields.
`apps/web/src/features/events/domain/public-events.ts` resolves inherited
content and normalizes stored dates into occurrences. An occurrence is one
event paired with one concrete stored date. The server-only boundary in
`apps/web/src/features/events/server/public-events.ts` fetches that domain for
website pages and route handlers.

`apps/web/src/app/api/v1/events/route.ts` owns the chronological collection.
`apps/web/src/app/api/v1/events/[slug]/route.ts` owns rich detail.
`apps/web/src/features/events/api/schemas.ts` is the runtime response contract,
and `apps/web/src/features/events/api/serializers.ts` maps normalized domain
objects into it. `apps/web/src/features/events/api/description.ts` converts
Portable Text to sanitized HTML/plain text. `apps/web/src/app/api/v1/openapi.json/route.ts`
generates OpenAPI schemas from the same Zod definitions.

`apps/web/src/features/events/integrations/broadcast-readiness.ts` is a pure,
non-writing completeness check. `apps/web/scripts/audit-broadcast-readiness.ts`
loads current published occurrences and reports incomplete paid events. It does
not contact Broadcast.

`apps/web/src/lib/structured-data.ts` still builds Schema.org objects embedded
on public pages. It is search metadata, not an external feed serializer.

## Plan of Work

First, remove the standalone feed route and every current consumer-facing
reference to it. Delete its route test and feed builder while retaining the
shared safe JSON-LD serializer used by page components. Remove the alternate
link from the arrangement listing and the DataFeed assertions from the
production workflow.

Second, make the v1 collection integration-complete. Extend the summary schema
with the effective modification timestamp, NOK pricing object, and ticket link.
Update the serializer so both collection and detail reuse these fields. Add a
third location variant named `venue` with the literal name `Det Akademiske
Kvarter`; use it only when neither a referenced room nor explicit free text is
present.

Third, align embedded Event JSON-LD and Broadcast readiness with the location
rule. Missing source location should produce a canonical Kvarteret Place with
its known address. Explicit free-text locations remain separate Place values.
The Broadcast audit must not report a missing location as unmapped, but must
continue reporting explicit free-text venues until an external mapping exists.

Fourth, update ADR 009, the public API reference, repository-interaction docs,
agent guidance, release documentation, and current architecture references.
Historical completed ExecPlans may retain descriptions of behavior at their
time, but current guidance must say the route is removed.

Finally, simplify the v1 representations. Remove cursor state, page metadata,
and response-level links; add the `timed`/`date` schedule union and
`detailKind` parent/leaf shapes; serialize descriptions with
`@portabletext/to-html` plus a strict sanitizer; add ETag validators; and
reject unsupported query parameters. Run focused route, serializer,
structured-data, and Broadcast tests. Since no Sanity schema or GROQ query
shape changed, Sanity TypeGen is not required solely for this revision; if
generated types drift during another check, investigate rather than accepting
unrelated output.

## Concrete Steps

Run commands from `/Users/kluvin/dev/kvarteret/samfunnetibergen` with Node 24:

    mise exec node@24 -- npm --workspace @samfunnet/web run test -- --run \
      src/features/events/api src/app/api/v1 \
      src/features/events/integrations/broadcast-readiness.test.ts \
      src/lib/structured-data.test.ts

    mise exec node@24 -- npm run format:check
    mise exec node@24 -- npm run typecheck:web
    mise exec node@24 -- npm run lint:web
    mise exec node@24 -- npm run build:web
    git diff --check

Run the current-data report when Sanity credentials/network are available:

    mise exec node@24 -- npm --workspace @samfunnet/web run \
      events:audit:broadcast -- --report-only

Before production, request `/api/v1/events?locale=nb` without a Vercel bypass
header and confirm HTTP 200 JSON. Confirm that an occurrence without room/free
text has `event.location.kind` equal to `venue` and name equal to `Det
Akademiske Kvarter`. Send `If-None-Match` from a previous response and confirm
HTTP 304 with no body. The release workflow performs these same checks,
including OpenAPI protocol operations and description/schedule shape. Confirm
that `/api/events/feed` returns 404 after removal.

## Validation and Acceptance

Focused tests must prove collection records expose `updatedAt`, pricing, ticket
link, venue fallback, and `{html,text}` descriptions. Detail tests must prove
leaf occurrences contain only id/schedule and parent details expose child
summaries without repeating parent fields. Schedule tests must prove overnight
timed and date-only representations. Description tests must prove supported
Portable Text renders and malicious URLs/markup are removed. ETag tests must
prove matching conditional requests return `304` with no body.
Structured-data tests must prove the canonical Kvarteret Place is emitted for a
missing source location and explicit free text is not overwritten. Broadcast
tests must prove the fallback venue is ready while explicit free text remains
unmapped.

The OpenAPI route must include the expanded summary fields because it derives
from the Zod schemas. Typecheck, lint, format, build, and diff checks must pass.
Repository search must find no current runtime route, alternate link, release
check, or integration guide advertising `/api/events/feed`.

External completion requires a Broadcast test-workspace import and written
agreement on occurrence identity, Broadcast venue ID and room mapping, tag
allowlist, polling cadence, cancellation mapping, and full-snapshot removal
semantics. Those external steps do not block completing the repository change.

## Idempotence and Recovery

All repository edits and checks are repeatable. The unrelated untracked
`.agents/execplans/021-durable-crescat-booking-promotion-continuation.md` belongs
to the user and must not be edited or removed. If removal exposes an unknown
feed consumer in production logs, restore the old route from version control
temporarily and make a separate deprecation decision rather than silently
changing `/api/v1`.

## Artifacts and Notes

Broadcast's current preferred record names are partner-specific and must not
become the canonical public API vocabulary. The public schema exposes domain
facts; Broadcast maps them. Timed schedules already include UTC timestamps with
`Z`, including overnight normalization.

## Interfaces and Dependencies

At completion, `PublicEventSummary` includes:

    updatedAt: string | null
    pricing: {
      currency: "NOK"
      isFree: boolean
      ordinary: number | null
      student: number | null
      member: number | null
    }
    description: {
      html: string
      text: string
    }
    links: {
      self: string
      website: string
      ticket: string | null
    }

Its `location` union includes referenced room, explicit text, and:

    { kind: "venue", name: "Det Akademiske Kvarter" }

`assessBroadcastReadiness` remains pure. `fetchPublicEventSet` remains the only
published collection fetch boundary. The API serializer directly depends on
`@portabletext/to-html` and `isomorphic-dompurify`; no external service is
introduced.

## Plan Revision Note

2026-09-02: Replaced the earlier DataFeed-retention plan after the user chose a
single explorable v1 API for both mobile and Broadcast. The revision records the
integration-complete collection, rich single-detail boundary, absence of batch
detail, removal of `/api/events/feed`, and Det Akademiske Kvarter fallback for
events without a room or free-text location.

2026-09-02: Recorded the follow-up removal of project rate limits, canonical
deployment origin, optional-ticket readiness policy, 23:00 concert estimate,
and source-backed BIFF content correction. BIFF times remain unset until the
official program publishes them.

2026-09-03: Recorded deployed-preview verification and the child-level BIFF
location correction discovered during field-level payload inspection.

2026-09-03: Implemented the user-approved simplification: all matching date
filters return a complete snapshot; cursor/page metadata and response-level
links were removed; schedule uses a discriminated timed/date union; collection
summaries include sanitized HTML/plain text descriptions; parent/leaf details
use `detailKind`; and GET/HEAD responses emit deterministic ETags with 304
support. Added strict unknown-parameter rejection while retaining the hidden
internal compatibility switch only in source parsing. Updated consumers,
focused tests, OpenAPI, reference documentation, and direct dependencies.

2026-09-03: Recorded final local verification and the unchanged Broadcast audit
baseline. OpenAPI validation has no errors; its remaining advisory warnings are
the absent repository license metadata and OPTIONS operations that truthfully
have only a 204 response.

2026-09-03: Narrowed the discriminated schedule to the API serializer boundary
after review so website calendar and structured-data code retain lossless local
date/time fields internally. Added browser-usable conditional requests by
allowing `If-None-Match` and exposing `ETag` through CORS, then recorded a local
production-server smoke test against 73 current occurrences.
