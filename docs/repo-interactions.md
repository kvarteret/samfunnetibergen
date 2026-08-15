# Repository Interactions

This document records current source-backed interactions for this repository.
Update it when a source-backed boundary changes.

## Arrangement Data

`samfunnetibergen` reads public arrangement data from Sanity.

Verified source:

- `apps/studio/src/studio/schemaTypes/documents/arrangement.ts`
- `apps/web/src/lib/sanity/queries/events.ts`
- `apps/web/src/lib/sanity/fetch/events.ts`
- `apps/web/src/app/[locale]/arrangementer/page.tsx`
- `apps/web/src/app/[locale]/arrangementer/[event]/page.tsx`
- `apps/web/src/app/api/ical/route.ts`
- `apps/web/src/app/api/events/feed/route.ts`

Do not document `kvarteret-personal` as the public arrangement source for this
site unless these call paths change.

## Volunteer Prospects

The public volunteer form submits to this repo first. The route validates the
payload and proxies accepted submissions to `kvarteret-personal`. It consumes
the raw request stream through a 16,384-byte limit and returns HTTP 413 before
UTF-8 decoding or JSON parsing when that limit is exceeded. The shared Zod
schema is authoritative on the server and also gives immediate browser
feedback. It bounds first and last names to 100 characters each, email and
friend-email values to 254, the E.164 phone value to 16, study institution to
160, background details to 2,000, group slugs to 100, friend entries to two,
and the honeypot to 200.

The route serializes the normalized Personal payload once and authenticates
that exact body with HMAC-SHA256 using the server-only
`VOLUNTEER_PROSPECT_HMAC_SECRET`. Personal rejects unsigned, altered, stale, and
replayed requests before application processing. HMAC proves that the request
came from a server holding the shared secret; it does not prove that the public
form was completed by a human.

Every published group can use the form. Sanity group slugs are forwarded
unchanged; Personal owns the stable group-slug lookup and resolves them to its
group IDs. Both repositories use the same deterministic slug rule without
aliases. In Studio, an existing group slug is hidden and read-only; it is only
generated while creating a new group.

The `quiz-gruppen` Sanity child group is an intentional exception to the
one-slug rule: Personal resolves that public slug to its active `kultur` group
(group ID 289) and keeps `Quiz-gruppen` as the displayed choice label. This
lets the child page use the parent group's operational volunteer records while
keeping the public choice specific.

Verified source:

- `apps/web/src/features/grupper/components/GroupVolunteerForm.tsx`
- `apps/web/src/features/grupper/domain/volunteerFormSchema.ts`
- `apps/web/src/app/[locale]/grupper/[slug]/page.tsx`
- `apps/web/src/app/api/volunteer-prospects/route.ts`
- `apps/web/src/lib/integrations/kvarteret-personal/volunteer-prospect-signing.ts`
- `../kvarteret-personal/app/domain/volunteer_applications/service.py`
- `../kvarteret-personal/app/api/request_auth.py`
- `../kvarteret-personal/app/api/v1/volunteer_prospects.py`
- `../kvarteret-personal/tests/unit/domain/test_data_services.py`

Each accepted browser request also has an idempotency key and a pseudonymous
client key. `GroupVolunteerForm.tsx` creates a UUID for a submitted value set,
reuses it for same-value retries while the component stays mounted, and creates
a new key after the submitted values change. The route accepts only a canonical
lowercase UUID and generates a UUID v4 fallback for callers that omit it.

For the client key, the Vercel route prefers `x-vercel-forwarded-for`, falls back
to Vercel's `x-forwarded-for`, selects the first address, and validates it as
IPv4 or IPv6. It derives
`v1=<lowercase HMAC-SHA256 hex>` over the trimmed, lowercase address using the
Samfunnet-only `VOLUNTEER_PROSPECT_CLIENT_KEY_SECRET`. The raw address is never
sent to Personal or included in application diagnostics. This trust model
assumes the route remains directly behind Vercel, which documents that it
overwrites `x-forwarded-for` to prevent spoofing and preserves
`x-vercel-forwarded-for` when another proxy rewrites the conventional header.
Re-evaluate the source header before moving the route to another host.

The server-to-server request carries:

    X-Kvarteret-Timestamp: <Unix seconds>
    X-Kvarteret-Nonce: <canonical lowercase UUID>
    X-Kvarteret-Idempotency-Key: <canonical lowercase UUID>
    X-Kvarteret-Client-Key: v1=<64 lowercase HMAC-SHA256 hex characters>
    X-Kvarteret-Signature: v2=<64 lowercase HMAC-SHA256 hex characters>

The v2 signature covers eight newline-separated values, with no final newline:

    v2
    <timestamp>
    <nonce>
    <idempotency key>
    <client key>
    POST
    /api/v1/volunteer-prospects
    <lowercase SHA-256 hex digest of the exact request body bytes>

Personal uses the bound keys for durable idempotency and route, client-key, and
normalized-email counters. It never needs the Samfunnet client-key secret.

The website Vercel project and Personal must contain the same active
`VOLUNTEER_PROSPECT_HMAC_SECRET`. The website alone must also contain a separate
`VOLUNTEER_PROSPECT_CLIENT_KEY_SECRET`; both values require at least 32
characters. Deploy Personal's v2-compatible verifier before switching the
website to v2. Personal may temporarily accept the old v1 signature while the
website rollout completes. For later request-secret rotation, Personal
temporarily accepts both its active `VOLUNTEER_PROSPECT_HMAC_SECRET` and
`VOLUNTEER_PROSPECT_HMAC_PREVIOUS_SECRET`; switch the website to the new active
value before removing the previous value from Personal. Secrets must remain in
Vercel environment configuration and must not be committed or prefixed with
`NEXT_PUBLIC_`.

## Generated Personal Client

The generated `kvarteret-personal` OpenAPI client directory is ignored by
`.gitignore` at `apps/web/src/lib/integrations/kvarteret-personal-api/`. Do not
add deploy-critical imports from that generated directory unless the
generated-file boundary is deliberately changed.

## Phone-number boundaries

The website keeps submitted phone numbers in E.164 format, including the
leading `+` and country calling code. The volunteer-prospect route forwards
that canonical value to `kvarteret-personal`. Crescat uses separate fields for
the national number and country calling code, so the Crescat adapter splits the
E.164 value only while constructing its external request.

Verified source:

- `apps/web/src/components/ui/phone-number-field.tsx`
- `apps/web/src/app/api/volunteer-prospects/route.ts`
- `apps/web/src/lib/integrations/crescat/phone.ts`
- `apps/web/src/lib/integrations/crescat/room-booking.ts`
- `apps/web/src/lib/integrations/crescat/karaoke.ts`

## Sanity Studio deployment boundary

`apps/studio` is the editor application. It writes to the same Sanity project
and dataset consumed by `apps/web`, but it is built as a static artifact and
deployed as a separate Vercel project at
`https://studio.samfunnetibergen.no`. Its requests, browser errors, deploys,
and logs therefore do not use the website's Next.js runtime or telemetry.

The website retains permanent redirects from `/studio` and `/studio/:path*`
for old bookmarks. It does not import Studio runtime code. Visual Editing
links generated by `apps/web/src/lib/sanity/client.ts` point directly at the
standalone origin, while Presentation continues to preview the website origin.

Verified source and deployment boundaries:

- `apps/studio/sanity.config.ts` and `apps/studio/src/studio/` own schema,
  structure, actions, inputs, migrations, and Presentation resolution.
- `apps/studio/vercel.json` owns static SPA fallback and Dashboard-compatible
  frame policy for the Studio project.
- `apps/web/src/lib/sanity/client.ts` owns the website's public read client and
  Visual Editing target.
- `apps/web/src/lib/studio-url.ts` and `apps/web/next.config.ts` own legacy
  website-to-Studio redirects.
- `.github/workflows/release-studio-production.yml` stages and promotes only
  the Studio Vercel project; it cannot move the website project.
