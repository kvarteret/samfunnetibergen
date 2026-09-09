# ADR 010: Room-booking submit via a stable route handler

**Status:** Accepted

**Date:** 2026-09-09

## Context

The room-booking form is long and expensive to fill in. Its submit path was a
Next.js server action: `submitRoomBooking` in
`apps/web/src/features/booking/actions/submit-room-booking.ts`, called from the
client in `apps/web/src/features/booking/components/BookingForm.tsx`.

A server action is addressed by a build-time action id, not a URL. Next.js
bakes the id into the client bundle, and the server holds a matching registry
from that same build. Every deploy re-hashes the bundle and rotates every id.
A visitor who loads the form, keeps the tab open across a release, and then
submits posts an id the new deployment no longer recognises. Next.js reports
this as `UnrecognizedActionError` ("Server Action ... was not found"), and the
booking is lost because the filled-in form cannot be submitted without a
reload.

The observed incidents cluster around deployments: the PostHog issue
`019faf0f-c97a-7fa1-9767-9f3a71c87036` shows the same `UnrecognizedActionError`
bursts on room pages (`/nb/rom/speilsalen`, `/nb/rom/teglverket`) immediately
after releases.

Two mitigations were added earlier and remain useful but do not solve this:

- `deploymentId: process.env.VERCEL_DEPLOYMENT_ID` in `apps/web/next.config.ts`
  enables Next.js version-skew handling and cache busting.
- `isStaleDeploymentError` / `STALE_DEPLOYMENT_ERROR` in
  `apps/web/src/lib/submission-messages.ts` detect the failure and ask the
  visitor to reload instead of retrying.

Both assume the visitor is willing to lose their input. Version-skew handling
also relies on Vercel routing the pinned request back to the old deployment,
which only works while that deployment is within the skew-protection maximum
age (one day by default). A long-lived form outlives that window.

## Decision

Move the room-booking submit off the build-specific server action and onto a
stable HTTP route handler:

- `apps/web/src/app/api/booking/route.ts` exposes `POST /api/booking`. The URL
  is identical across deployments, so there is no rotating id to go stale.
- `submit-room-booking.ts` loses its `"use server"` directive and becomes a
  plain server-only module. It keeps all validation, honeypot, rate-limit,
  availability, and Crescat delivery behaviour unchanged.
- A thin client helper, `apps/web/src/features/booking/api/submit-room-booking.ts`,
  posts the form values as JSON and returns the same `Result<number>` the
  server action used to return, so `BookingForm.tsx` keeps its existing error
  and success handling.

The submit is now `browser -> POST /api/booking -> submitRoomBooking -> Crescat`.
The endpoint's identity is a URL, not a build.

### CSRF

Server actions reject cross-origin action POSTs on our behalf. A plain route
handler does not, so the route re-implements that same-origin gate. `POST
/api/booking` rejects requests whose `Origin` header names a different host
than the request's own host. Browsers attach `Origin` to every POST and cannot
forge it (it is a forbidden header), so a mismatching origin is conclusive.
Requests without an `Origin` header (curl, server-to-server callers) pass the
gate because they are not subject to browser CSRF. A cross-origin JSON POST is
also stopped earlier by the CORS preflight, since the route sends no CORS allow
headers.

## Consequences

- An open tab that loaded an older build still submits successfully after a
  redeploy, as long as the request/response contract is unchanged. The
  expensive form is no longer lost to deploy skew.
- The submit boundary now requires an explicit same-origin check instead of
  inheriting it from server actions. That check is covered by
  `apps/web/src/app/api/booking/route.test.ts`.
- No-JavaScript progressive enhancement is not relevant here: the booking form
  is already a JavaScript TanStack form, so a `fetch` submit loses nothing.
- The request body shape and the `Result` response shape become a contract.
  They must stay backward-compatible (an older client posting an older shape
  should still reach a newer handler and fail softly with a validation error,
  never with "action not found").
- Other submit surfaces (`submit-karaoke-booking`, `submitEvent`, and the
  volunteer form) still use server actions and keep the reload-on-stale
  behaviour. This ADR scopes the durable fix to room booking first.

## Alternatives considered

### Keep the server action and rely on Vercel skew protection

Rejected as the sole fix. It is a platform toggle with a default one-day
maximum age, so a long-lived form still fails once the pinned deployment ages
out or is deleted. It also does not help on platforms without skew protection.

### Keep the server action and only improve the stale-deployment message

Already shipped (`STALE_DEPLOYMENT_ERROR`), but it instructs the visitor to
reload, discarding the filled-in form. It is a fallback, not a fix.

### Move every form to a route handler now

Deferred. Room booking is the high-stakes, long-form case that triggered this
work. Karaoke, event, and volunteer submits can adopt the same pattern later
without changing the decision recorded here.

### Durable intake before delivery (ADR 008)

Orthogonal. ADR 008 concerns recording the submission durably before the
Crescat call so it can be replayed after a failure. This ADR concerns only the
transport identity of the submit boundary. The two compose: a route handler is
the natural place to add durable intake later.

## Verification

Run the focused route and booking tests, then typecheck and build the web app:

    npm --workspace @samfunnet/web run test -- --run src/app/api/booking src/features/booking
    npm --workspace @samfunnet/web run typecheck
    npm run build:web

The new `apps/web/src/app/api/booking/route.test.ts` proves that a
cross-origin POST is rejected with `403` before any booking logic runs, that a
same-origin POST delegates to `submitRoomBooking` and returns its `Result`, and
that malformed bodies are rejected with `400`.
