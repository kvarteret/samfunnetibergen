# Bound and identify public volunteer prospect submissions

This ExecPlan is a living document. The sections Progress, Surprises &
Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date
in accordance with `.agents/PLANS.md`.

## Purpose / Big Picture

The public volunteer form must remain usable while resisting oversized input,
repeated submissions, and basic abuse without exposing a visitor's network
address to the Personal service. After this change, Samfunnet rejects request
bodies larger than 16 KiB before JSON parsing, applies explicit size and count
limits to every submitted form value, derives a pseudonymous client key from the
visitor IP using a separate server-only secret, and supplies a stable
idempotency key for retries. Personal can authenticate and rate-limit those two
keys because both are covered by the server-to-server HMAC signature.

## Progress

- [x] (2026-08-14 10:29Z) Read `AGENTS.md`, `.agents/README.md`,
  `.agents/PLANS.md`, the API-boundary, repository-interaction, security, and web
  verification skills, and the relevant installed Next.js 16 route, request,
  environment, backend-for-frontend, and data-security documentation.
- [x] (2026-08-14 10:29Z) Inspected the current route, form schema, browser form,
  signing helper, tests, deployment documentation, and Personal's current v1
  verifier.
- [x] (2026-08-14 10:29Z) Coordinated exact v2 header names and canonical signing
  order with the concurrent Personal implementation.
- [x] (2026-08-14 10:43Z) Implemented bounded stream reading and bounded
  authoritative Zod validation for every visible and hidden form field.
- [x] (2026-08-14 10:43Z) Implemented pseudonymous client-IP key derivation,
  idempotency propagation, and the v2 signature.
- [x] (2026-08-14 10:43Z) Preserved a browser-generated UUID across
  same-payload retries and regenerated it when submitted values change.
- [x] (2026-08-14 10:43Z) Updated focused schema, signing, and route tests; 37
  tests passed before the final signature-binding assertion was added.
- [x] (2026-08-14 10:43Z) Updated durable boundary and release configuration
  documentation after verifying the concurrent Personal source.
- [x] (2026-08-14 10:45Z) Completed verification and diff review: 38 focused
  tests and 222 full web tests passed, with 3 expected skips; TypeScript,
  ESLint, focused Biome, `git diff --check`, and the production build passed.
- [x] (2026-08-14 11:00Z) Ran both repository dependency audits. Personal is
  clean. Applied Samfunnet's available non-breaking audit updates, including
  Next 16.3.1 and patched direct overrides; recorded the remaining Sanity CLI
  dependency pins rather than accepting `npm audit fix --force`'s breaking
  Sanity downgrade.

## Surprises & Discoveries

- Observation: Next.js 16 removed the `NextRequest.ip` property.
  Evidence: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/next-request.md`
  lists `ip` and `geo` as removed in version 15, so the route must use deployment
  request headers rather than a framework property.
- Observation: Vercel documents `x-vercel-forwarded-for` as the stable copy of
  its client-IP header and says it overwrites ordinary `x-forwarded-for` to
  prevent spoofing on direct Vercel deployments.
  Evidence: Vercel's current Request Headers reference, verified on 2026-08-14.
- Observation: the current browser form has no mutation library or explicit
  retry object; each TanStack Form submit calls `fetch` directly.
  Evidence: `apps/web/src/features/grupper/components/GroupVolunteerForm.tsx`.
  A component ref can preserve a generated UUID between equivalent submit
  attempts without adding storage or a dependency.
- Observation: direct invocation of repository CLIs from the desktop shell did
  not put Node on child-process `PATH`, and the first Turbopack build could not
  spawn a Node worker.
  Evidence: the first build reported `spawning node pooled process - No such
  file or directory`; rerunning `mise x node@24.16.0 -- npm run build:web`
  compiled, type-checked, generated all 138 static pages, and completed.
- Observation: another concurrent task added unrelated bar-opening and Studio
  changes to the shared worktree after this plan began.
  Evidence: final `git status --short` lists modified navbar, bar, Sanity, and
  Studio files that were not present in the initial clean status and were not
  edited by this plan. They must remain untouched and be excluded from this
  task's changed-file report.
- Observation: Personal's concurrent implementation matches the coordinated
  contract in current source.
  Evidence: sibling `app/api/request_auth.py` accepts the shared v2 line order,
  validates canonical UUID and client-key headers, and applies route/client
  counters; `app/api/v1/volunteer_prospects.py` matches the field limits and
  applies a normalized-email counter and transactional idempotency input.
- Observation: `npm audit fix` removed the directly remediable Samfunnet
  findings, but the current Sanity 6 CLI tree still pins vulnerable
  `js-yaml@3.13.1`, `smol-toml@1.5.2`, `undici@7.28.0`, and `uuid@10.0.0`.
  Evidence: `npm ls` traces them through `@vercel/frameworks`,
  `@module-federation/dts-plugin`, and `typeid-js`; the audit's remaining
  automated remedy is `--force`, which proposes a breaking downgrade from
  Sanity 6 to 5.14.1. Scoped root overrides do not replace these exact nested
  nodes under the current npm workspace resolver. The uuid advisory concerns
  v3/v5/v6 buffer calls, while `typeid-js` uses v7 and `stringify`, but it
  remains tracked until upstream moves to uuid 11 or newer.

## Decision Log

- Decision: cap the incoming raw request body at 16,384 bytes and stop stream
  consumption as soon as the limit is exceeded, returning HTTP 413 before text
  decoding or `JSON.parse`.
  Rationale: a `Content-Length` check alone can be absent or false, while
  `request.json()` consumes and parses the entire body before application code
  can enforce a limit.
  Date/Author: 2026-08-14 / Codex.
- Decision: derive `X-Kvarteret-Client-Key` as
  `v1=<lowercase HMAC-SHA256 hex>` over the trimmed, lowercase, validated client
  IP, keyed by `VOLUNTEER_PROSPECT_CLIENT_KEY_SECRET`.
  Rationale: Personal needs a stable rate-limit dimension but must never receive
  or persist the raw address. A separate secret prevents reuse of the request
  authentication key for a different security purpose.
  Date/Author: 2026-08-14 / Codex.
- Decision: prefer `x-vercel-forwarded-for`, fall back to `x-forwarded-for`, use
  only the first comma-separated address, and reject missing or invalid IPs.
  Rationale: the site deploys on Vercel, whose current documentation identifies
  these as its client address headers and preserves the `x-vercel-*` form if an
  upstream proxy rewrites the conventional header. Validation prevents arbitrary
  strings from becoming rate-limit identities.
  Date/Author: 2026-08-14 / Codex.
- Decision: accept a canonical lowercase UUID in
  `X-Kvarteret-Idempotency-Key` or generate UUID v4 when the browser omits it.
  The current form keeps a key in a ref for retries of the same serialized form
  values and creates a new key after values change.
  Rationale: same-payload network retries remain one logical submission, while a
  deliberately changed payload is a new attempt. Server generation preserves
  compatibility for callers that do not yet provide a key.
  Date/Author: 2026-08-14 / Codex.
- Decision: sign protocol v2 using eight newline-separated lines: version,
  timestamp, nonce, idempotency key, client key, method, path, and SHA-256 body
  digest. Emit `X-Kvarteret-Signature: v2=<64 lowercase hex>`.
  Rationale: binding both routing controls prevents a public caller or an
  intermediary from substituting another pseudonym or dedupe key after
  Samfunnet has authenticated the request.
  Date/Author: 2026-08-14 / Codex.
- Decision: Personal must deploy a verifier that accepts v2 before Samfunnet
  begins sending v2; Personal may temporarily retain v1 acceptance.
  Rationale: the existing Personal verifier accepts only `v1=` signatures, so
  the opposite order would interrupt legitimate submissions.
  Date/Author: 2026-08-14 / Codex.
- Decision: do not commit during this plan.
  Rationale: the user explicitly prohibited commits, overriding PLANS.md's
  normal frequent-commit guidance.
  Date/Author: 2026-08-14 / Codex.
- Decision: apply safe audit updates but do not run `npm audit fix --force`.
  Rationale: the forced remedy changes the Studio's Sanity major version and is
  materially broader than this security hardening. The remaining packages are
  nested in the Sanity CLI/build toolchain, not the public volunteer route;
  their exact upstream pins and reachability are documented above.
  Date/Author: 2026-08-14 / Codex.

## Outcomes & Retrospective

Samfunnet now rejects bodies above 16 KiB before decode or parse, applies
explicit Zod bounds at the public server boundary, sends only an opaque keyed
IP pseudonym, and binds that value and a retry-stable UUID into the v2 request
signature. The browser retains a UUID for same-value retries without adding a
dependency or durable client storage. Personal confirmed the shared v2 vector
and implemented the matching consumer controls.

All 38 focused tests and 222 full web tests passed, with 3 expected skips.
TypeScript, ESLint, focused Biome, `git diff --check`, and the production build
also passed after the final edits. The production build's configured PostHog
hook uploaded source maps and emitted its existing empty-map warnings, but the
build completed. Safe dependency updates removed all immediately remediable
findings; 15 audit entries remain in the pinned Sanity CLI dependency tree and
require upstream releases or a separately tested Sanity major migration. No
real secret changed. Unrelated concurrent
bar-opening and Studio changes remain untouched in the shared worktree.

## Context and Orientation

The browser form lives in
`apps/web/src/features/grupper/components/GroupVolunteerForm.tsx`. It validates
with the shared Zod schema in
`apps/web/src/features/grupper/domain/volunteerFormSchema.ts` and sends JSON to
the public Next.js route at
`apps/web/src/app/api/volunteer-prospects/route.ts`. That route is the
authoritative public validation boundary. It normalizes the accepted data,
serializes one outbound JSON body, and calls Personal at
`POST /api/v1/volunteer-prospects`.

The HMAC signer in
`apps/web/src/lib/integrations/kvarteret-personal/volunteer-prospect-signing.ts`
now implements protocol v2. HMAC means hash-based message authentication
code: it lets Personal verify that a server with the shared secret produced the
headers and that signed values did not change. The pseudonymous client key is a
separate HMAC whose output is stable for one source IP but cannot be reversed to
the raw address without the Samfunnet-only client-key secret.

An idempotency key identifies one logical submission. Reusing it for a retry
allows Personal to return or recognize the first result rather than creating a
duplicate. The browser can preserve that key while its React component remains
mounted; the server generates a fallback for direct callers that omit it.

## Plan of Work

Extend the server-only integration helper at
`apps/web/src/lib/integrations/kvarteret-personal/volunteer-prospect-signing.ts`
to validate the deployment client-IP header with Node's standard `net` module,
validate the separate secret, and return only the `v1=` client pseudonym. Make
the signing helper require the client key and idempotency key and build protocol
v2 in the agreed line order. Keep the helper free of logging so raw IP values
never reach logs.

In the route, read the Web `Request.body` stream through a 16 KiB bounded helper.
Check a valid `Content-Length` first for an early rejection, but retain the
stream counter because that header is optional and untrusted. Decode and parse
only a body proven to fit, then run the shared Zod schema. Before forwarding,
accept or generate the idempotency UUID, derive the client pseudonym, construct
the v2 authentication headers, and forward the two bound headers alongside the
existing timestamp, nonce, signature, and trace headers. Configuration or IP
derivation failures fail closed without calling Personal.

Apply explicit maxima to names, email addresses, phone, institution,
background details, both group slugs, friend-email entries, and the friend list.
The same schema remains installed in the browser for immediate feedback and in
the route for authoritative enforcement. Add matching HTML length hints where
the existing component supports them without weakening server validation.

In the browser form, create an idempotency UUID for the serialized submitted
values, retain it in a React ref, and send it in
`X-Kvarteret-Idempotency-Key`. Reuse it when a retry serializes to the same value
and replace it when values change.

Extend route tests to prove 413 occurs before JSON parsing and forwarding, both
declared and streamed over-limit bodies fail, bounded field input fails, valid
headers are forwarded, raw IP is absent, missing secrets and IP fail closed,
and idempotency input is accepted/generated. Extend signing tests with a shared
v2 vector and mutation checks. Extend schema tests for every maximum and count.

Update `docs/repo-interactions.md` and
`docs/how-to/release-production.md` with the exact headers, canonical message,
privacy boundary, new server-only setting, and Personal-first v2 rollout order.

## Concrete Steps

All commands run from `/Users/kluvin/dev/kvarteret/samfunnetibergen`.

1. Edit the route, domain schema, browser form, and integration helpers using
   the paths above.
2. Run focused tests from `apps/web` so Vitest loads the workspace aliases:

       mise x node@24.16.0 -- npx vitest run src/features/grupper/domain/volunteerFormSchema.test.ts src/lib/integrations/kvarteret-personal/volunteer-prospect-signing.test.ts src/app/api/volunteer-prospects/route.test.ts

3. Run broader touched-surface verification:

       mise x node@24.16.0 -- npm run test:web
       mise x node@24.16.0 -- npm run typecheck:web
       mise x node@24.16.0 -- npm run lint:web
       mise x node@24.16.0 -- npx --no-install biome check apps/web/src/app/api/volunteer-prospects apps/web/src/features/grupper/domain/volunteerFormSchema.ts apps/web/src/features/grupper/domain/volunteerFormSchema.test.ts apps/web/src/features/grupper/components/GroupVolunteerForm.tsx apps/web/src/lib/integrations/kvarteret-personal apps/web/src/messages/en.json apps/web/src/messages/nb.json
       mise x node@24.16.0 -- npm run build:web

4. Inspect `git diff --check`, `git diff`, and `git status --short`; do not stage
   or commit.

## Validation and Acceptance

A JSON body of at most 16,384 raw bytes with valid bounded fields, a trustworthy
Vercel client-IP header, and both configured secrets reaches Personal with
`X-Kvarteret-Client-Key`, `X-Kvarteret-Idempotency-Key`, and a valid v2
signature. Neither the outbound request nor captured diagnostics contains the
raw IP. A body of 16,385 bytes returns HTTP 413 before JSON parsing and before
`fetch`. Oversized individual values and more than two friend emails return HTTP
400 before forwarding.

Repeating the same browser submission after a transport failure reuses the UUID.
Changing the submitted values causes the current UI to use a new UUID. Direct
callers without a key receive a server-generated one; malformed supplied values
receive HTTP 400.

The focused Vitest files, web TypeScript check, web lint, focused Biome check,
and production web build must pass. Any unrelated baseline failure will be
isolated and documented rather than changed.

## Idempotence and Recovery

The source and documentation edits are additive and safe to reapply. No real
secret, raw IP, database state, or external deployment is written. If a test
run is interrupted, rerun the same command. If a production rollout must be
aborted, leave Personal's backward-compatible v1/v2 verifier deployed and roll
Samfunnet back to v1; do not deploy the v2-only Samfunnet signer before Personal
accepts it.

## Artifacts and Notes

The outbound headers are:

    X-Kvarteret-Timestamp: <Unix seconds>
    X-Kvarteret-Nonce: <canonical lowercase UUID>
    X-Kvarteret-Idempotency-Key: <canonical lowercase UUID>
    X-Kvarteret-Client-Key: v1=<64 lowercase HMAC-SHA256 hex characters>
    X-Kvarteret-Signature: v2=<64 lowercase HMAC-SHA256 hex characters>

The signature canonical message has no final newline:

    v2
    <timestamp>
    <nonce>
    <idempotency key>
    <client key>
    POST
    /api/v1/volunteer-prospects
    <lowercase SHA-256 hex digest of the exact request body bytes>

## Interfaces and Dependencies

Use only Node built-ins already available to the Next.js Node runtime: `crypto`
for UUID, SHA-256, and HMAC; `net.isIP` for IP validation; Web Request stream
APIs for bounded body reading; and the existing Zod 4 dependency for validation.
No generated Personal client or new package is required.

`createVolunteerProspectAuthHeaders` must accept the exact serialized body, the
shared request HMAC secret, and options containing `idempotencyKey`, `clientKey`,
and optional deterministic `timestamp` and `nonce`. The route must pass its
returned authentication headers unchanged.

Revision note (2026-08-14 10:29Z): Created after source inspection and
cross-repository contract coordination, before implementation.

Revision note (2026-08-14 10:43Z): Recorded the completed implementation,
source-backed Personal coordination, test/build evidence, toolchain build retry,
and concurrent unrelated worktree changes; left only final post-edit checks
pending.

Revision note (2026-08-14 10:45Z): Closed the plan after the final focused test,
TypeScript, lint, Biome, and whitespace checks passed; corrected the narrative to
match the implemented integration-module placement and v2 current state.

Revision note (2026-08-14 11:00Z): Recorded dependency-audit remediation and
the remaining upstream-pinned Sanity CLI findings after rejecting the audit
tool's breaking forced downgrade.
