# ADR 001: Crescat event-request integration

**Status:** Accepted
**Date:** 2026-05-21 (karaoke), generalized 2026-06-04 (room booking), updated 2026-06-15 (drift reconciliation + autofetched rooms), updated 2026-06-23 (per-day doors times), updated 2026-08-20 (calendar date-time policy)

## Context

Samfunnet i Bergen uses Crescat as its venue management and booking system. We expose
self-service booking forms on the website so guests can submit a booking request without going
through reception. Each form must talk to Crescat's event-request API on behalf of the user.

Crescat does not provide a public REST API with API keys. It exposes event-request form endpoints
protected by Laravel's CSRF mechanism (XSRF-TOKEN cookie + `x-xsrf-token` header). This is the only
programmatic path available without building on top of the venue management UI itself.

We reverse-engineered the request format by capturing HAR traces of real Crescat form submissions.
The integration started as a karaoke-only feature and has since been generalized to drive any of
the venue's event-request forms. It lives in `src/lib/integrations/crescat/`.

## Decision

### Module layout

| File | Responsibility |
|---|---|
| `client.ts` | Generic CSRF handshake + `postEventRequest(slug, body)`. Form-agnostic. |
| `types.ts` | `EventRequestBody` and the full `EventRequestSection` union. |
| `datetime.ts` | Shared `toDateTime`, `addHoursToDateTime`, `resolveEndDateTime` (midnight-crossing aware). |
| `fields.ts` | Venue-global metadata field/parent-ID registry + `metaField()` helper. |
| `form-template.ts` | Extract + normalize the Inertia form template from a Crescat page. |
| `karaoke.ts` | `buildKaraokeRequest` — karaoke booking payload. |
| `room-booking.ts` | `buildExternalBooking` / `buildInternalBooking` + `ROOM_BOOKING_SLUGS`. |
| `calendar.ts` | Public read-only calendar + resources endpoints, per-booker-type calendar mapping. |

### Request flow (generic)

```
User submits form
  → server action (e.g. submitRoomBooking / submitKaraokeBooking)
      → build*Request (constructs EventRequestBody for a specific form)
      → postEventRequest(slug, body)   (src/lib/integrations/crescat/client.ts)
          1. GET  /event-requests/{slug}   ← fetches XSRF-TOKEN + crescat_session cookies
          2. POST /event-requests/{slug}   ← submits booking with cookies + token header
          → returns Result<number> (ok = HTTP status; err = user-facing message)
```

### CSRF handshake (step 1)

Laravel issues a new `XSRF-TOKEN` cookie on every GET to the form page. The token is URL-encoded in
the cookie; it must be decoded and sent back as the `x-xsrf-token` header on the POST. Both the
`XSRF-TOKEN` and `crescat_session` cookies must be echoed back together. We fetch a fresh token
immediately before every POST (no caching), so the token is always valid at submit time. The fetch
is server-side (Next.js server action), so cookies are never exposed to the browser.

### Booking payload (step 2)

The POST body is a JSON `EventRequestBody`: top-level requester fields (`name`, `start`, `end`,
`description`, `request_by_*`, `request_by_country_code: "+47"`, `model_id`/`model_type: null`) plus
an ordered `sections` array. Each form has its own section list and order, reproduced faithfully
from its HAR. Section types observed across the venue's forms:

`roomBooking`, `metaData`, `termsOfUse`, `recurringDates`, `keyContacts`, `assignments`,
`alternativeDates`, `moreInformation`.

### Venue-global field IDs

Crescat metadata field IDs and `metaData.parent_id`s are **venue-global**: the same IDs appear
across the venue's different forms (e.g. the "Bestilling" block parent `7896` with fields
`57056`/`57057`/`57058`/`80461`/`1329447` is identical in the standard and internal room forms). They are
captured once in `fields.ts` and reused by every builder. `room_id`s are per-room, not per-form.

The catering block (`parent_id 11068`) has different fields per form: the standard (ekstern) form uses
title "Mat og drikke" with fields `80447`, `4365154` ("Jeg står i bar selv"), `4382234` ("Kvarteret
står i bar"); the intern form uses title "Catering/bar" with only `80447`. Both forms share the
"Bestilling" amfi toggle (`80461`, "Behov for amfi? NB: gjelder KUN Tivoli").

### Form template introspection (the de-facto spec)

Crescat publishes no API specification. The form pages are server-rendered Inertia.js apps: the
complete form definition is embedded in the page HTML as a `data-page` attribute on the application
root element, HTML-entity-encoded. Decoding that attribute yields a JSON object; under
`props.eventRequestTemplate` is the ordered section list with every field's id, title, component,
required flag, CSS class, and options — the "API spec" Crescat never published.

**`form-template.ts`** exports pure functions (`extractDataPage`, `normalizeTemplate`,
`diffTemplateAgainstRegistry`) and a network wrapper (`fetchNormalizedTemplate`). No headless browser
is needed — a `fetch` and an HTML-entity decode suffice.

**CLI** (`npm run crescat:introspect`):

```
npm run crescat:introspect -- <slug>          # print normalized template as JSON
npm run crescat:introspect -- --diff <slug>   # compare live template vs fields.ts, print drift, exit 1 if any
npm run crescat:introspect -- --save <slug>   # write fixture file
npm run crescat:introspect -- --save-all      # refresh all known-slug fixtures
npm run crescat:introspect -- --rooms <cal>   # print /resources for a calendar
npm run crescat:introspect -- --rooms-coverage# list rooms vs Sanity coverage per calendar
```

**Fixtures.** Three normalized templates are committed under
`src/lib/integrations/crescat/__fixtures__/forms/` for the standard, intern, and karaoke forms.
These are the contract: the automated `fields.contract.test.ts` (vitest) diffs each fixture against
the registry in `fields.ts` and fails when any registry-field is missing from a fixture. Run
`--save-all` after a form change to regenerate fixtures, then fix `fields.ts` until the contract
test passes.

### Room booking: intern vs. ekstern

The website's "Book rom her" CTA points to an internal page (`/rom/book`) instead of an external
Crescat link. A booker-type picker decides which Crescat form receives the submission. There are
**three** booker types but only two forms — `studentorg` and `ekstern` both submit the standard form
(`slugForBookerType` in `room-booking.ts`):

| Booker | Slug | Notes |
|---|---|---|
| Ekstern / privat | `studentersamfunnet-i-bergen-bookingskjema-standard` | studentorg metadata off |
| Studentorganisasjon | `studentersamfunnet-i-bergen-bookingskjema-standard` | sets `3186172=true` + org name `3186171` |
| Intern (driftsorg) | `studentersamfunnet-i-bergen-bookingskjema-dorger-borger-og-interne` | |

Both slugs were verified at HTTP 201 from captured HAR traces. (An alternative internal form,
`...bookingskjema-driftsorganisasjoner-faste-arrangement`, exists but was **not** the one captured;
the verified `dorger-borger-og-interne` form is used. If the intern form should change, capture a
fresh HAR and update `ROOM_BOOKING_SLUGS` + the field registry.)

Our UI presents a leaner, redesigned form than the native Crescat one, but the payload sent to
Crescat is **complete**: fields we do not ask for explicitly are derived or defaulted so all
Crescat-required fields are populated. Examples:

- Top-level `request_by_*` and intern `keyContacts[0]` ← the single contact block.
- Ekstern invoice section ← contact name/email/phone + an explicit "Fakturaadresse" field.
- Empty ticket/catering inputs → `"N/A"` / `"Nei"`.
- `alternativeDates`, promotering fields → `[]`; `recurringDates` → `null`;
  ekstern `moreInformation` → a static avbestillingsvilkår block.

#### Composed free-text fields (E-51)

Crescat has no dedicated field for several E-51 inputs, so they are composed into existing free-text
fields by the builders:

- **Tech needs** → `Nødvendig teknisk utstyr` (57057): the selected chips joined, e.g.
  `"Mikrofon 4x, Projektor + lerret, Musikkavspilling, Dedikert lydtekniker"`. (`Ønsket møblement`
  57056 remains its own input.)
- **Catering + bar** → catering section (`parent_id 11068`): the skreddersydd-meny text in field
  `80447`, plus on the standard form two boolean toggles `4365154` ("Jeg står i bar selv") and
  `4382234` ("Kvarteret står i bar"). The intern form has no bar toggles — only `80447`.
- **Doors** → the `assignments` section: a 0-minute `Doors` entry (`start == end`) per day that has a
  doors time set; event `start`/`end` stay as the show times on the top level + `roomBooking`. Doors
  times are modeled as `doorsTimes: string[]`, one optional entry per calendar day spanned by the
  booking (index 0 = start date), not a single value — multi-day bookings can have a different public
  doors time on each day (e.g. a festival that opens earlier on day 2). Each non-empty entry becomes
  its own `Doors` (or `Doors dag N` when there is more than one) assignment dated `startDate + index`
  days. The booking form only shows day 1's box by default; "Dørene åpner samme tid hver dag" fills
  every day with day 1's value in one click, and "Legg til dag N" reveals one more day's box at a
  time, so the common single-value case stays a single click without forcing per-day entry.
  Promotion prefill (`buildPromotionDefaults`) uses `doorsTimes[0]` — the first day's value — the same
  way it previously used the single `doorsTime`.
- **Flexible dates** (ekstern/studentorg) → appended to the top-level `description`
  (`"Fleksibel på dato og rom: ja"`) only when no structured `alternativeDates` are provided;
  when structured alternative dates are given, the `alternativeDates` section carries the array
  and the description note is skipped to avoid duplicate signal.

### Room → Crescat room ID

The booking room picker is autofetched from Crescat's `/resources` for the form's calendar, then
enriched with Sanity content matched by `crescatRoomId`. Rooms that exist only in Crescat (no Sanity
document) are still bookable — they render as title-only minimal cards and use house opening hours
for validation. Rooms with a Sanity document render the full card (image, summary, capacities,
room-specific opening hours). Sanity rooms sort first, Crescat-only rooms sort last; within each
group the `/resources` order is preserved.

The `/resources` endpoint is per calendar and returns the curated, public, bookable room set:

| Calendar slug | Rooms | Used by |
|---|---|---|
| `...bookingkalender` | 7 (23,95,96,97,98,117,118) | ekstern, studentorg |
| `...bookingkalender-privat` | 15 (std 7 + 119-125,128) | intern |
| `...bookinkalender-karaoke` | 1 (98, Maos) | karaoke |

The form page's `props.rooms` attribute is the same 28-room full venue inventory on every form and
is intentionally **not** used for the picker. If a room (e.g. 287 Bakgården) appears in the
captured intern submission but not in the privat `/resources`, it won't appear in the autofetched
picker — the venue must add it to the privat calendar in Crescat.

If `/resources` returns empty (Crescat unreachable), the picker falls back to the Sanity bookable
rooms so it is never blank.

### Availability calendars and resources (read-only)

Crescat exposes public, unauthenticated read endpoints per booking calendar:

```
GET /venue-access/{calendarSlug}/calendar?start=…&end=…   → CresatBooking[]
GET /venue-access/{calendarSlug}/resources                → CresatResource[]
```

Both are plain GETs (no CSRF/session needed). `calendar.ts` wraps them as `fetchVenueCalendar` and
`fetchVenueResources`. `CresatBooking` carries `resourceId` (= Crescat `room_id`), timezone-less
`start`/`end` date-time strings, and a `title`; `CresatResource` is `{ id, room_title, title }`.
Calendar is cached 5 min, resources 1 h.

#### Calendar date-time policy

Crescat's calendar responses currently contain values such as `2026-09-10T17:30:00`, without a
UTC marker or numeric offset. This is a reverse-engineered boundary, not a published Crescat
timezone contract. Crescat's shared calendar displays those components unchanged, and the venue,
its users, and Crescat booking operations are based in Norway. The website therefore treats these
values as Norwegian civil times.

`datetime.ts` owns that policy through `crescatLocalDateTimeMs`. It parses the supplied calendar
components into a synthetic UTC-backed number solely for stable comparison; it does not interpret
the raw value in the browser's or server's timezone. Room availability, server-side room conflict
validation, conflict labels, occupied ranges, and karaoke availability all use this same helper.
Code outside the Crescat adapter and availability domains must not call `new Date()` on a raw
Crescat calendar value.

The strict timezone-less input shape is deliberate drift detection. If Crescat starts returning
offset-bearing timestamps or changes the format, update the adapter policy from fresh live evidence
instead of allowing JavaScript runtime timezone rules to decide the booking time implicitly.

#### Availability telemetry

The room form emits `room_booking_rejected` when a submission is stopped by opening hours or a
Crescat calendar conflict. Client-side prechecks emit the event through `posthog-js`, which attaches
the PostHog session ID even when Session Replay is disabled. If replay is enabled later, the event can
also be located in the recording. The server emits the same event if its authoritative validation
catches a conflict or opening-hours rejection. Diagnostic properties contain the reason, requested
room IDs and date/time range, source, submission ID, and trace ID where available. They do not contain
contact details, event descriptions, or other submitted free text.

Calendar HTTP and network failures are captured as handled PostHog exceptions with the
`server_request` workflow, `crescat-calendar` source, calendar slug, requested date window, and HTTP
status where available. Technical submission failures continue to use handled exceptions under the
`room_booking` workflow. This separates expected availability rejections from integration failures
while making both searchable in PostHog.

Booker types map to calendars via `calendarSlugForBookerType`:

| Booker type | Calendar slug | Rooms |
|---|---|---|
| ekstern / studentorg | `studentersamfunnet-i-bergen-bookingkalender` | 7 |
| intern | `studentersamfunnet-i-bergen-bookingkalender-privat` | 15 |
| karaoke | `studentersamfunnet-i-bergen-bookinkalender-karaoke` | 1 |

On the room-booking page, the calendar is fetched per booker type and bookings are matched to the
chosen room by `resourceId == crescatRoomId`; overlapping intervals are shown and block submission.
Conflict checks use the booker type's calendar, so intern bookings are validated against the privat
calendar, closing the intern-availability gap previously recorded here.

Crescat-only rooms (no Sanity document) are validated against house hours alone — no room-specific
opening hours restriction applies.

## Known risks and edge cases

### CSRF token expiry

The XSRF-TOKEN is session-scoped. Because we fetch a fresh token immediately before every POST, it
should always be valid. If Crescat's server is unreachable for step 1, `fetchXsrfSession` returns
`null` and the action returns a user-visible error ("Klarte ikke å opprette sesjon mot
bookingsystemet."). If Crescat changes its CSRF implementation (signed double-submit cookie, GET
rate limiting), submissions will start failing with HTTP 419 or similar — monitor for non-2xx
statuses from `postEventRequest`.

### Double-booking: volunteer vs. external (karaoke)

The karaoke availability calendar reflects all confirmed bookings regardless of price type.
Volunteer (frivillig) bookings are requests, not instant confirmations — they land in Crescat's
queue for manual approval. The business rule: external bookings have priority and may displace a
volunteer booking if placed at least 12 hours before the session start. The venue team manages this
in Crescat; the website does not enforce or automate displacement. A theoretical race exists if two
overlapping requests are submitted before either is approved — Crescat's approval workflow is the
safeguard.

### Midnight-crossing slots

Opening hours on some days extend past midnight. `datetime.ts` advances the end date by one day when
the end time is at or before the start time (`resolveEndDateTime`) or when an hours-based duration
wraps (`addHoursToDateTime`). The karaoke slot picker also stores start times as minutes-from-
midnight (values ≥ 1440 for post-midnight slots) and compares overlaps with absolute millisecond
timestamps.

### Hardcoded IDs

All Crescat IDs (room IDs, field IDs, `parent_id`s, form slugs) were obtained by inspecting real
form-submission HARs. They are stable as long as the Crescat venue configuration is not recreated.
If a form or its metadata fields are rebuilt in Crescat's admin panel, a new HAR capture and an
update to `fields.ts` / `room-booking.ts` / `karaoke.ts` will be required.

## Deferred / future concerns (E-51)

- **Intern recurring (`recurringDates`).** The internal form has a "Gjentagende arrangement" section,
  sent as `content: null` today. We have not captured a HAR of a submission that actually uses it, so
  the populated content shape is unknown and recurring is **not** implemented. Capture a real recurring
  intern submission, then model the `recurringDates` content and wire it (the create-event form already
  has an RRULE model to map from).
- **Promotion.** E-51 wants a promotion step (upload an image now, or "upload later" → an email with an
  upload link sent when the room coordinator confirms the booking). This needs infra we don't have: a
  persisted booking record, a Crescat booking-confirmation signal (likely manual/polled — there is no
  webhook), an email service, and a hosted upload portal. Deferred to its own phase/issue.
- **Multi-room and multi-contact UI.** The builders and payload schema support `roomIds` (multiple
  rooms) and `keyContacts` (multiple named contacts with roles), but the booking form UI still submits
  one room and one contact. The intern form's "Kontaktpersoner" section has separate name/role per
  contact; exposing this in the UI is deferred.
- **Crescat-only room caveat.** A room that appears in a form's 28-room `props.rooms` inventory but
  not on that form's calendar `/resources` (e.g. room 287 Bakgården in a captured intern submission)
  will not appear in the autofetched picker. The venue must add it to the relevant calendar in
  Crescat's admin panel for it to become bookable from the website.

## Consequences

- No API key or OAuth credential to manage. The downside is a scraping-style integration that could
  break on Crescat backend changes.
- Submissions from the website create event requests in Crescat exactly as if the user had filled in
  the native Crescat form. Staff handle them through the normal approval workflow.
- The integration is fully server-side. No Crescat credentials or session data reach the browser.
