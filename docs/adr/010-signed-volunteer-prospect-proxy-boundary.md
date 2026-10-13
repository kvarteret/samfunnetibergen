# ADR 010: Signed volunteer-prospect proxy boundary

## Status

Accepted.

## Context

The public volunteer form is part of this website, but volunteer applications
are owned by `kvarteret-personal`. The website must accept anonymous browser
submissions without exposing a direct write path into Personal, and Personal
must be able to reject forged, altered, stale, and replayed requests before
application processing.

## Decision

The public form submits to `apps/web` first. `POST /api/v1/volunteer-prospects`
validates the payload with the shared Zod schema, enforces a 16,384-byte raw
request-body limit (returning HTTP 413 before UTF-8 decoding or JSON parsing),
and then proxies accepted submissions to `kvarteret-personal`. Personal owns the
stored application, durable idempotency counters, and the stable group-slug
lookup; Sanity group slugs are forwarded unchanged and both repositories apply
the same deterministic slug rule without aliases.

Each proxied request is authenticated with HMAC-SHA256 over a v2 canonical
message. The request carries:

    X-Kvarteret-Timestamp: <Unix seconds>
    X-Kvarteret-Nonce: <canonical lowercase UUID>
    X-Kvarteret-Idempotency-Key: <canonical lowercase UUID>
    X-Kvarteret-Client-Key: v1=<64 lowercase HMAC-SHA256 hex characters>
    X-Kvarteret-Signature: v2=<64 lowercase HMAC-SHA256 hex characters>

The v2 signature covers eight newline-separated values with no final newline:
the literal `v2`, the timestamp, the nonce, the idempotency key, the client
key, `POST`, `/api/v1/volunteer-prospects`, and the lowercase SHA-256 hex digest
of the exact request-body bytes.

Idempotency keys are canonical lowercase UUIDs. `GroupVolunteerForm.tsx`
creates one UUID per submitted value set, reuses it for same-value retries while
the component stays mounted, and creates a new key after the values change. The
route generates a UUID v4 fallback for callers that omit one.

The client key is a pseudonymous identifier. The route prefers
the browser-scoped PostHog distinct ID from the request cookie, otherwise it
prefers `x-vercel-forwarded-for` and falls back to `x-forwarded-for`, selects
the first address, validates it as IPv4 or IPv6, and combines it with the
user-agent. It hashes that material with an HKDF-SHA256 subkey derived from
`PERSONAL_SIGNING_SECRET` using `kvarteret/volunteer-client-fingerprint/v1` as
the fixed purpose string. The derived key exists only in memory.
Raw identity material is never sent to Personal or included in application
diagnostics.

`quiz-gruppen` is an independent Sanity group that routes to Personal's active
`quiz` group while Personal keeps the displayed choice label. Its Sanity
`parentGroup` must remain unset so it appears in the top-level public listing.

## Consequences

All signed website requests and booking tokens use the shared
`PERSONAL_SIGNING_SECRET` and purpose-specific prefixes. `PERSONAL_SIGNING_PREVIOUS_SECRET`
supports rotation. The website no longer stores a separate client-key secret.
Old volunteer and booking secret environment variables are ignored. Existing
booking promotion links remain valid because the retired volunteer key had the
same value as `PERSONAL_SIGNING_SECRET`. Keep signing values server-only. The
secret setup and rotation steps live in `docs/how-to/release-production.md`.

The client-key fallback assumes the route stays directly behind Vercel, which
overwrites `x-forwarded-for` and preserves `x-vercel-forwarded-for` when another
proxy rewrites the conventional header. Re-evaluate the source header before
moving the route to another host. HMAC proves the request came from a server
holding the shared secret; it does not prove that a human completed the public
form.

## Verification

Verified source:

- `apps/web/src/app/api/volunteer-prospects/route.ts`
- `apps/web/src/lib/integrations/kvarteret-personal/volunteer-prospect-signing.ts`
- `apps/web/src/features/grupper/components/GroupVolunteerForm.tsx`
- `apps/web/src/features/grupper/domain/volunteerFormSchema.ts`

Run the focused tests from the repository root:

    npm --workspace @samfunnet/web exec vitest run \
      src/lib/integrations/kvarteret-personal/volunteer-prospect-signing.test.ts \
      src/app/api/volunteer-prospects/route.test.ts
