# ADR 010: Form submits via stable route handlers

**Status:** Accepted

**Date:** 2026-09-09

## Context

The room-booking, karaoke-booking, and public event forms are long and
expensive to fill in. Their submit paths were Next.js server actions, addressed
by a build-time action id rather than a URL:

- `submitRoomBooking` in `apps/web/src/features/booking/actions/submit-room-booking.ts`
- `submitKaraokeBooking` in `apps/web/src/features/karaoke/actions/submit-karaoke-booking.ts`
- `submitEvent` and `uploadEventImage` in `apps/web/src/features/events/actions/submitEvent.ts`

Next.js bakes the action id into the client bundle and holds a matching registry
from that same build. Every deploy re-hashes the bundle and rotates every id. A
visitor who loads a form, keeps the tab open across a release, and then submits
posts an id the new deployment no longer recognises. Next.js reports this as
`UnrecognizedActionError` ("Server Action ... was not found"), and the booking
or submission is lost because the filled-in form cannot be sent without a
reload.

The observed incidents cluster around deployments: the PostHog issue
`019faf0f-c97a-7fa1-9767-9f3a71c87036` shows the same `UnrecognizedActionError`
bursts on room pages (`/nb/rom/speilsalen`, `/nb/rom/teglverket`) immediately
after releases.

Two mitigations were added earlier and remain useful for other surfaces but do
not solve this:

- `deploymentId: process.env.VERCEL_DEPLOYMENT_ID` in `apps/web/next.config.ts`
  enables Next.js version-skew handling and cache busting.
- `isStaleDeploymentError` / `STALE_DEPLOYMENT_ERROR` detected the failure and
  asked the visitor to reload instead of retry. Both discarded the visitor's
  input, and version-skew handling only works while the old deployment is
  within the skew-protection maximum age (one day by default), which a
  long-lived form outlives.

## Decision

Move the submit paths off build-specific server actions and onto stable HTTP
route handlers. The URL is identical across deployments, so there is no
rotating id to go stale:

- `POST /api/booking` — room booking (JSON body).
- `POST /api/karaoke` — karaoke booking (JSON body).
- `POST /api/events` — event submission (JSON body).
- `POST /api/events/image` — event image upload (multipart form data).

Each route lives under `apps/web/src/app/api/`. Each `"use server"` directive is
removed from the corresponding action module, which becomes a plain server-only
module and keeps its validation, honeypot, rate-limit, availability, and
delivery behaviour unchanged. Thin client helpers under
`apps/web/src/features/<area>/api/` post the values and return the same
`Result` the server action used to return, so the forms keep their existing
error and success handling. Read-only data-fetch actions (room and karaoke
availability, bookable rooms) remain server actions; they are cheap to retry
and not part of this decision.

The submit is now `browser -> POST /api/<surface> -> server-only module ->
Crescat or Sanity`. The endpoint's identity is a URL, not a build.

### CSRF

Server actions reject cross-origin action POSTs on our behalf. A plain route
handler does not, so the routes re-implement that same-origin gate. The shared
helper `apps/web/src/lib/csrf.ts` exports `isSameOriginRequest`, which rejects
requests whose `Origin` header names a different host than the request's own
host. Browsers attach `Origin` to every POST and cannot forge it (it is a
forbidden header), so a mismatching origin is conclusive. Requests without an
`Origin` header (curl, server-to-server callers) pass the gate because they are
not subject to browser CSRF. A cross-origin JSON POST is also stopped earlier
by the CORS preflight, since the routes send no CORS allow headers. Every route
applies the check before reading the body.

## Consequences

- An open tab that loaded an older build still submits successfully after a
  redeploy, as long as the request/response contract is unchanged. The
  expensive forms are no longer lost to deploy skew.
- The submit boundaries now require an explicit same-origin check instead of
  inheriting it from server actions. That check is covered by the route tests
  under `apps/web/src/app/api/`.
- No-JavaScript progressive enhancement is not relevant here: these forms are
  already JavaScript TanStack forms, so a `fetch` submit loses nothing.
- The request body shapes and the `Result` response shapes become contracts.
  They must stay backward-compatible: an older client posting an older shape
  should still reach a newer handler and fail softly with a validation error,
  never with "action not found".
- The stale-deployment detection (`isStaleDeploymentError`,
  `STALE_DEPLOYMENT_ERROR`, and the `staleDeploymentError` message key) became
  dead once no submit form used a server action, and was removed. The
  `deploymentId` config remains for asset cache busting and navigation skew
  handling.

## Alternatives considered

### Keep server actions and rely on Vercel skew protection

Rejected as the sole fix. It is a platform toggle with a default one-day
maximum age, so a long-lived form still fails once the pinned deployment ages
out or is deleted. It also does not help on platforms without skew protection.

### Keep server actions and only improve the stale-deployment message

Was shipped, then removed here. It instructed the visitor to reload, discarding
the filled-in form, so it is a fallback rather than a fix.

### Migrate only room booking

Rejected in favour of covering all three submit surfaces in one decision. The
same skew failure applies to karaoke and event submissions, and a shared CSRF
helper plus one ADR is simpler than three near-identical one-offs.

### Durable intake before delivery (ADR 008)

Orthogonal. ADR 008 concerns recording the submission durably before the
external call so it can be replayed after a failure. This ADR concerns only the
transport identity of the submit boundary. The two compose: a route handler is
the natural place to add durable intake later.

## Verification

Run the focused route and form tests, then typecheck and build the web app:

    npm --workspace @samfunnet/web run test -- --run src/app/api/booking src/app/api/karaoke src/app/api/events src/features/booking src/features/karaoke src/features/events
    npm --workspace @samfunnet/web run typecheck
    npm run build:web

The route tests prove that a cross-origin POST is rejected with `403` before
any submit logic runs, that a same-origin POST delegates to the server-only
module and returns its `Result`, and that malformed bodies are rejected with
`400`.
