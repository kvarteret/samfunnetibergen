# ADR 001: Crescat event-request integration

**Status:** Accepted
**Date:** 2026-05-21 (karaoke), generalized 2026-06-04 (room booking)

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
| `karaoke.ts` | `buildKaraokeRequest` — karaoke booking payload. |
| `room-booking.ts` | `buildExternalBooking` / `buildInternalBooking` + `ROOM_BOOKING_SLUGS`. |

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
`57056`/`57057`/`57058`/`1329447` is identical in the standard and internal room forms). They are
captured once in `fields.ts` and reused by every builder. `room_id`s are per-room, not per-form.

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
- **Catering + bar** → catering field (80447): the skreddersydd-meny text plus, when bar is requested,
  a line `"Bar: ønsker at Kvarteret stiller i bar (2000 kr eks. mva)"` (Crescat has no bar field).
- **Doors** → the `assignments` section: a 0-minute `Doors` entry (`start == end`) at the doors time;
  event `start`/`end` stay as the show times on the top level + `roomBooking`.
- **Flexible dates** (ekstern/studentorg) → appended to the top-level `description`
  (`"Fleksibel på dato og rom: ja"`); `alternativeDates` stays `[]`.

### Room → Crescat room ID

Rooms carry an optional `crescatRoomId` (number) field in Sanity. Only rooms with this ID are
offered in the booking-page room picker (`bookableRoomsQuery` / `fetchBookableRooms`). The selected
room's `crescatRoomId` is sent as `roomBookings[].room_id`.

### Availability calendars and resources (read-only)

Crescat exposes public, unauthenticated read endpoints per booking calendar:

```
GET /venue-access/{calendarSlug}/calendar?start=…&end=…   → CresatBooking[]
GET /venue-access/{calendarSlug}/resources                → CresatResource[]
```

Both are plain GETs (no CSRF/session needed). `calendar.ts` wraps them as `fetchVenueCalendar` and
`fetchVenueResources`. `CresatBooking` carries `resourceId` (= Crescat `room_id`), `start`/`end` ISO
timestamps, and a `title`; `CresatResource` is `{ id, room_title, title }`. Calendar is cached 5 min,
resources 1 h.

Two calendars are in use:

| Calendar slug | Covers |
|---|---|
| `studentersamfunnet-i-bergen-bookinkalender-karaoke` | Karaoke room (Maos) — karaoke slot picker. |
| `studentersamfunnet-i-bergen-bookingkalender` | Standard venue rooms — room-booking availability. |

On the room-booking page, the standard venue calendar is fetched for the selected date and bookings
are matched to the chosen room by `resourceId == crescatRoomId`; overlapping intervals are shown and
block submission.

**Gap — intern form coverage.** The standard venue calendar only covers the rooms exposed by that
calendar. The intern (dørger/borger/interne) form books rooms (e.g. Bakgården, room 287) that are
**not** on this calendar, and we do not yet have the calendar/resources endpoints for the intern
form. Until those are obtained, availability and any live room-list auto-fetch are incomplete for
intern bookings — the room picker still relies on the `crescatRoomId` values stored in Sanity, and
intern-only rooms show no availability. Capturing the intern form's calendar/resources slugs is
required for a full view.

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
- **Per-form calendar/resources for intern.** As noted above, the standard venue calendar does not
  cover intern-only rooms; the intern form's own calendar/resources endpoints are still needed for full
  availability + live room-list there.

## Consequences

- No API key or OAuth credential to manage. The downside is a scraping-style integration that could
  break on Crescat backend changes.
- Submissions from the website create event requests in Crescat exactly as if the user had filled in
  the native Crescat form. Staff handle them through the normal approval workflow.
- The integration is fully server-side. No Crescat credentials or session data reach the browser.
