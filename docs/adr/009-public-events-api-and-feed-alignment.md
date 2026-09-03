# ADR 009: One complete versioned events API

**Status:** Accepted

**Date:** 2026-09-03

## Context

Sanity owns arrangement content. `apps/web` owns the public read boundary that
resolves localization, inherited parent fields, effective status, visibility,
and Europe/Oslo occurrences. External consumers need that resolved result
without querying Sanity or reproducing editorial rules.

The mobile app and Broadcast both need the same chronological occurrence
stream. Broadcast also needs enough event information to map records without a
request per occurrence. Website detail pages need rich content and remain
server-rendered consumers of the same service.

## Decision

`GET /api/v1/events` is the only HTTP events API. It returns every matching
occurrence in one complete snapshot. The default request starts today in
Europe/Oslo; optional `from` and `to` filters are inclusive. There is no page
metadata or summary/detail split.

Each item contains an opaque occurrence ID, a discriminated schedule, and one
complete public event object. The event object includes identity, status,
effective modification time, localized title, sanitized HTML/plain-text
description, image, taxonomy, organizer, location, pricing, parent summary,
and website, ticket, and Facebook links. A multi-date event appears once per
stored date. The parent relationship is a bounded summary so payloads do not
recurse.

The public location resolution order is a referenced room, explicit free-text
location, then `Det Akademiske Kvarter`. The fallback is a venue fact and does
not invent a Sanity room ID.

The API accepts `locale=nb|en` and unknown parameters are rejected. Norwegian
is the default and field-level fallback. Responses are anonymous and support
cross-origin `GET`, `HEAD`, and `OPTIONS`, shared caching, ETags, and
conditional `304` responses. Errors use stable `code` and `message` fields.

The website event detail page uses the server service directly. No event-detail
HTTP route is maintained. Schema.org Event JSON-LD remains embedded in event
pages for search metadata; there is no standalone linked-data feed or
iCalendar endpoint.

## Consequences

There is one external schema, one OpenAPI document, and one occurrence
resolver. Mobile and Broadcast receive the same identity, schedule, status,
location, and rich event fields. The complete snapshot can grow as more
materialized occurrences are published, so response size and cache behavior
should be observed. Any future breaking contract requires a new API version.

Broadcast uses the occurrence ID as its stable match key. Ticket URLs are
optional purchase metadata and may be shared by multiple occurrences. Before
handoff, Broadcast and Samfunnet must agree on venue mapping, tags, polling,
cancellation behavior, and how a missing occurrence is reconciled.

## Verification

Run the source-data audit before handing the collection to Broadcast:

    npm --workspace @samfunnet/web run events:audit:broadcast -- --report-only

Run focused event tests, web typecheck, and the web build when route or API
changes are made. Regenerate Sanity types only when a query or schema changes.
