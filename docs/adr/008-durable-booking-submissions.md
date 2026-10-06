# ADR 008: Capture bookings in Kvarteret Personal before Crescat

**Status:** Accepted (supersedes the deferred 2026-08-26 design)
**Date:** 2026-10-06

## Decision

The organization requires at-least-once capture of booking information in
Kvarteret Personal, both to retain requests and to support future prefilled
Create event forms. The website validates the request and availability, builds
the Crescat payload, and awaits a committed Personal snapshot receipt before
calling Crescat. Personal owns private storage and its migrations; the website
continues to own booking validation and Crescat dispatch. Public event content
remains Sanity-backed. The previous proposal for website-owned Postgres and a
dispatch queue is superseded by this explicit product requirement.

```text
browser -> website validation -> Personal snapshot commit -> receipt
        -> website Crescat dispatch -> browser outcome
```

Each snapshot contains the versioned validated form, generated Crescat body,
contact information, rooms, and mandatory doors-open/doors-close schedule for
every selected day. Reservation start/end are distinct from public doors times.
Karaoke session start/end supply its doors times. This preserves data for future
prefilling without introducing a read API or prefill UI now.

The browser reuses a submission UUID on retry. Personal hashes normalized
snapshot content and atomically deduplicates `(submission_id, content_hash)`.
Identical retries return the same receipt, including under concurrency. Edits
preserve a new snapshot rather than overwriting an earlier version.

## Failure and security boundaries

Personal commits before acknowledging. A missing receipt prevents Crescat
forwarding and the browser retains its form for retry. Once committed, the
snapshot survives a subsequent Crescat error. The UI still reports success only
after Crescat accepts the request. There is no automatic dispatch/replay worker,
and Crescat offers no verified exactly-once delivery contract.

The website signs body bytes using the existing server-only shared HMAC key,
with a booking-specific signing purpose, short validity and single-use nonce.
Personal caps body size and rate, validates the snapshot, and exposes no public
read route. The archive is protected by RLS and revoked public/browser-role
access. Contact details and free text must not enter ordinary logs or PostHog.
Records currently persist until authorized backend deletion; no automatic
expiry is introduced.

## Deployment and consequences

Personal's migration and API deployment must precede the website release.
The website gains a synchronous dependency on Personal for booking submission.
Failure of either storage or Crescat leaves the browser responsible for retry;
the archive preserves information already captured before forwarding.

Source evidence:

- `apps/web/src/features/booking/actions/submit-room-booking.ts`
- `apps/web/src/features/karaoke/actions/submit-karaoke-booking.ts`
- `apps/web/src/lib/integrations/kvarteret-personal/booking-requests.ts`
- Personal `app/api/v1/booking_requests.py`
- Personal `app/api/booking_request_auth.py`
- Personal `app/domain/booking_requests/`
- Personal `docs/reference/booking-requests.md`
