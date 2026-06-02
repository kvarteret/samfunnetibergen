# ADR 001: Crescat karaoke booking integration

**Status:** Accepted  
**Date:** 2026-05-21

## Context

Samfunnet i Bergen uses Crescat as its venue management and booking system. Karaoke bookings for Maos Lille Røde are managed there. We expose a self-service booking form on the website so guests can request a slot without going through the reception. The form must talk to Crescat's event-request API on behalf of the user.

Crescat does not provide a public REST API with API keys. It exposes an event-request form endpoint that is protected by Laravel's CSRF mechanism (XSRF-TOKEN cookie + `x-xsrf-token` header). This is the only programmatic path available without building on top of the venue management UI itself.

## Decision

We reverse-engineered the request format by capturing a HAR trace of a real Crescat form submission. The integration lives in `src/lib/integrations/crescat/` and works as follows:

### Request flow

```
User submits form
  → submitKaraokeBooking (server action)
      → buildKaraokeRequest (constructs EventRequestBody)
      → postEventRequest (src/lib/integrations/crescat/client.ts)
          1. GET /event-requests/{slug}          ← fetches XSRF-TOKEN + crescat_session cookies
          2. POST /event-requests/{slug}         ← submits the booking with cookies + token header
          → returns ok | error
```

### CSRF handshake (step 1)

Laravel issues a new `XSRF-TOKEN` cookie on every GET to the form page. The token is URL-encoded in the cookie; it must be decoded and sent back as the `x-xsrf-token` header on the POST. Both the `XSRF-TOKEN` and `crescat_session` cookies must be echoed back together.

The fetch is done server-side (Next.js server action), so the cookies are never exposed to the browser.

### Booking payload (step 2)

The POST body is a JSON `EventRequestBody` with three sections:

| Section type | Purpose |
|---|---|
| `roomBooking` | Reserves room ID 98 (Maos Lille Røde) for the requested interval |
| `metaData` | Records the number of people against field ID 1439211, inside metadata parent 192383 |
| `termsOfUse` | Marks the terms as accepted |

Room ID, field ID, and parent ID were extracted from the HAR trace and are hardcoded constants in `src/lib/integrations/crescat/karaoke.ts`. If Crescat ever rebuilds their form configuration these values would need to be updated.

The booking description includes pricing information as plain text because Crescat does not have a dedicated price/package field in the event-request API.

### Availability calendar

Existing bookings are fetched from Crescat's public iCal-style JSON calendar endpoint:

```
GET /venue-access/studentersamfunnet-i-bergen-bookinkalender-karaoke/calendar?start=…&end=…
```

This returns an array of `CresatBooking` objects with `start` and `end` as ISO timestamps. The frontend slot picker uses these to grey out unavailable time slots. The calendar is cached for 5 minutes (`next: { revalidate: 300 }`).

## Known risks and edge cases

### CSRF token expiry

The XSRF-TOKEN has a session-scoped lifetime on the Crescat side. Because we fetch a fresh token immediately before every POST submission, the token should always be valid at the time of the request. There is no token caching — step 1 (GET) always runs before step 2 (POST).

If Crescat's server is unreachable for step 1, `fetchXsrfSession` returns `null` and the action returns a user-visible error. The form surfaces this as "Klarte ikke å opprette sesjon mot bookingsystemet."

If Crescat changes its CSRF implementation (e.g. moves to a signed double-submit cookie or adds rate limiting on GETs), submissions will start failing with HTTP 419 (CSRF mismatch) or similar. Monitor for `submitKaraokeBooking` returning non-201 status codes.

### Double-booking: volunteer vs. external

The availability calendar reflects all confirmed Crescat bookings regardless of price type. Volunteer (frivillig) bookings submitted through this form are **requests**, not instant confirmations — they land in Crescat's booking queue for manual approval by the venue team, just like external bookings.

The business rule is:

- External bookings always have priority over volunteer bookings.
- An external booking may displace a volunteer booking if it is placed **at least 12 hours before** the session start.
- The venue team is responsible for managing this in Crescat; the website form itself does not enforce or automate the displacement.

The form UI informs volunteers of this rule in the "Frivillig" package panel. The 12-hour cutoff is a manual operational convention, not a technical constraint enforced in code.

Because both booking types go through the same Crescat request endpoint and both show up in the same availability calendar once approved, a race condition is theoretically possible: two users submit overlapping requests before either is approved. Crescat's own approval workflow is the safeguard against this actually resulting in a double-booking.

### Midnight-crossing slots

Opening hours for some days extend past midnight (e.g. Mon–Thu: 12:00–01:00). Slot start times are stored as minutes offset from midnight of the selected date, allowing values ≥ 1440 for post-midnight slots. Overlap checking uses absolute millisecond timestamps (`new Date(date + "T00:00:00").getTime() + slotStartMin * 60_000`) to avoid comparing a midnight slot against the wrong calendar day.

Submissions for post-midnight slots pass `startTime: "00:30"` (for example) alongside the selected `startDate`. `buildKaraokeRequest` calls `addHoursToDateTime`, which detects midnight crossings by comparing start and end hours and advances the end date by one day when needed.

### Hardcoded IDs

`KARAOKE_ROOM_ID`, `KARAOKE_FIELD_PEOPLE_ID`, and `KARAOKE_META_PARENT_ID` in `src/lib/integrations/crescat/karaoke.ts` were obtained by inspecting a real form submission HAR. They are stable as long as the Crescat venue configuration is not recreated. If the karaoke room or its metadata form is ever rebuilt in Crescat's admin panel, a new HAR capture and update to these constants will be required.

## Consequences

- No API key or OAuth credential to manage. The downside is that this is a scraping-style integration that could break on Crescat backend changes.
- Submissions from the website create event requests in Crescat exactly as if the user had filled in the native Crescat form. Staff handle them through the normal Crescat approval workflow.
- The integration is fully server-side. No Crescat credentials or session data are exposed to the browser.
