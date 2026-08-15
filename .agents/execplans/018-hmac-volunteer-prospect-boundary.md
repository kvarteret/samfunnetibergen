# Authenticate volunteer prospect forwarding with HMAC

This ExecPlan is a living document. The sections Progress, Surprises &
Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date
in accordance with `.agents/PLANS.md`.

## Purpose / Big Picture

Volunteer applications submitted on `samfunnetibergen` currently reach a public
Personal endpoint without server authentication. After this change,
`samfunnetibergen` signs each forwarded request with a shared secret that is
available only to the two server deployments. Personal verifies the signature,
rejects stale or replayed requests, and processes a prospect only after that
verification succeeds. A direct unsigned call to Personal returns HTTP 401.

## Progress

- [x] (2026-08-14 09:48Z) Verified the live caller and callee source paths and
  read both repositories' security, API, documentation, and verification rules.
- [x] (2026-08-14 09:48Z) Chose the signed message format, configuration names,
  replay window, and zero-downtime secret rotation approach.
- [x] (2026-08-14 10:02Z) Implement and test verification in
  `kvarteret-personal`.
- [x] (2026-08-14 10:02Z) Regenerate and inspect the Personal OpenAPI contract.
- [x] (2026-08-14 10:02Z) Implement and test signing in `samfunnetibergen`.
- [x] (2026-08-14 10:02Z) Document configuration, deployment order, rotation,
  and source ownership
  in both repositories.
- [x] (2026-08-14 10:02Z) Run focused and repository-level verification and
  record the evidence.

## Surprises & Discoveries

- Observation: Personal already has a Postgres-backed fixed-window rate limiter.
  Evidence: `app/db/rate_limit.py` stores keyed counters in `rate_limits`, so a
  verified nonce can be accepted once across all Vercel instances without a new
  table or migration.
- Observation: the website's route already serializes one outbound JSON body and
  injects trace headers before calling Personal.
  Evidence: `apps/web/src/app/api/volunteer-prospects/route.ts` can sign the exact
  `JSON.stringify` result without changing the public browser payload.
- Observation: a shell probe accidentally hashed JSON containing literal escape
  backslashes and produced a different expected signature than the raw body.
  Evidence: the initial fixed-vector test failed with `24f96e...` expected and
  `3cfde7...` actual; computing from the raw bytes established `3cfde7...` as the
  shared value. Both implementations must keep this vector to catch encoding
  drift.
- Observation: deploying Personal verification before the website signer would
  reject legitimate unsigned traffic during the gap between deployments.
  Evidence: the old Personal route ignores unknown authentication headers, so
  the safe initial order is to provision both secrets, deploy the signer first,
  then deploy enforcement. Secret rotation still updates Personal first because
  the previous-secret setting preserves the old caller during that transition.
- Observation: FastAPI parses and validates malformed JSON before resolving the
  route's HMAC dependency.
  Evidence: an unsigned `not-json` body returns HTTP 422 while the prospect
  service remains uncalled. Valid JSON without authentication returns HTTP 401.
  The planned request-size guard remains necessary to bound work before parsing;
  HMAC is caller authentication rather than a body-size control.
- Observation: the website's existing npm dependency graph has audit findings
  unrelated to this change.
  Evidence: `npm audit --audit-level=low` reported 23 vulnerabilities (5 high
  and 18 moderate) in the existing Next/Sanity tooling graph. The HMAC change
  adds no package and leaves both manifest and lockfile untouched.
- Observation: the production website build's existing PostHog hook uploaded
  source maps and warned about empty maps for several small server pages.
  Evidence: `npm run build:web` completed successfully after the warnings; no
  HMAC route compilation or type error occurred.

## Decision Log

- Decision: Sign a versioned canonical message containing timestamp, nonce,
  method, route path, and SHA-256 body digest with HMAC-SHA256.
  Rationale: method/path binding prevents moving a valid signature to another
  endpoint, while the body digest makes any payload change invalidate it.
  Date/Author: 2026-08-14 / Codex.
- Decision: use `X-Kvarteret-Timestamp`, `X-Kvarteret-Nonce`, and
  `X-Kvarteret-Signature: v1=<lowercase hex>`.
  Rationale: explicit versioning permits a future canonical-format migration and
  keeps authentication separate from tracing and browser-visible fields.
  Date/Author: 2026-08-14 / Codex.
- Decision: accept at most five minutes of clock skew and consume each verified
  nonce once in Personal's Postgres-backed rate limiter.
  Rationale: timestamps bound captured-request lifetime; durable nonce use closes
  replay within that lifetime across stateless server instances.
  Date/Author: 2026-08-14 / Codex.
- Decision: Personal accepts one primary secret and one optional previous secret;
  Samfunnet signs with only the active secret.
  Rationale: operators can add a new Personal secret, switch the caller, then
  remove the old secret without opening an unsigned compatibility window.
  Date/Author: 2026-08-14 / Codex.
- Decision: deploy the website signer before Personal enforcement for the initial
  cutover, after provisioning the same secret in both projects.
  Rationale: extra headers are backward-compatible with the old Personal route;
  the reverse order would create a legitimate-submission outage.
  Date/Author: 2026-08-14 / Codex.
- Decision: fail production startup when the primary secret is missing or shorter
  than 32 characters, and fail the route closed in every environment.
  Rationale: an accidentally unconfigured deployment must not silently restore
  public unauthenticated intake.
  Date/Author: 2026-08-14 / Codex.

## Outcomes & Retrospective

The two services now share a versioned HMAC-SHA256 protocol with body, method,
path, timestamp, and nonce binding. Personal rejects valid-JSON unsigned,
altered, stale, and replayed calls before prospect processing; it accepts the
optional previous secret during rotation and fails production startup without a
strong active value. Samfunnet serializes once, signs those exact bytes, and
fails without making an outbound request when configuration is absent.

Personal verification passed Ruff, four import contracts, OpenAPI regeneration
and check, 346 tests with 12 environment-gated skips, Bun audit, npm audit, and
Python audit. Samfunnet verification passed 193 web tests with 3 skips, web
TypeScript, ESLint, focused Biome checks, and the production Next.js build. Its
pre-existing npm audit findings remain outside this no-new-dependency boundary.

The remaining abuse controls are deliberately separate: bounded request and
field sizes, durable per-IP/email route limits, submission idempotency, and
optional server-verified Turnstile. HMAC authenticates the proxy but does not
prove the public browser user is human.

## Context and Orientation

The callee repository is `../kvarteret-personal`. Its FastAPI route
`app/api/v1/volunteer_prospects.py` owns
`POST /api/v1/volunteer-prospects`; `app/api/router.py` mounts the route and
`openapi.json` is the checked-in API contract. Settings are defined in
`app/config.py`. The shared `app/db/rate_limit.py` implementation persists
counters in Postgres, which is necessary because Vercel function memory is not
shared or durable.

The caller is this repository. The browser posts the public form to
`apps/web/src/app/api/volunteer-prospects/route.ts`. That Next.js server route
validates the browser payload and forwards normalized JSON to Personal. The
shared HMAC secret must remain a server-only environment variable and must never
use a `NEXT_PUBLIC_` prefix.

HMAC means hash-based message authentication code. It combines a secret with a
message so the recipient can detect both forgery and message modification. A
nonce is a random request identifier used once. The two services use the same
canonical message, meaning the same byte-for-byte text assembled in the same
field order.

## Plan of Work

In Personal, add server-only settings for the active and optional previous
secret, and extend production validation. Add a small authentication module that
constructs the canonical message, validates header formats and clock skew,
compares candidate signatures in constant time, and consumes the nonce only
after a signature matches. Wire it as a FastAPI dependency on only the volunteer
prospect route. Add API tests proving valid acceptance and rejection of missing,
bad, stale, altered, and replayed requests. Expose the three headers and HMAC
security requirement in OpenAPI without changing the JSON body or operation ID.

In Samfunnet, serialize the outbound payload once, generate a UUID nonce and Unix
timestamp, compute the same canonical message with Node's built-in `crypto`
module, and attach all three headers. If its active secret is missing, do not call
Personal; return the existing generic error and record only non-sensitive
diagnostics. Add route tests for deterministic signing and missing configuration.

Update `kvarteret-personal/docs/reference/api-boundaries.md`,
`kvarteret-personal/docs/reference/configuration.md`, and
`samfunnetibergen/docs/repo-interactions.md`. The documentation must identify the
source files on each side, state that HMAC authenticates the server holding the
secret rather than a human browser, provide the Personal-first rollout order,
and distinguish initial signer-first rollout from active/previous-secret
rotation.

## Concrete Steps

1. From `../kvarteret-personal`, add the verifier and route dependency, then run
   the focused API/web tests.
2. From `../kvarteret-personal`, run `kv openapi`, inspect `openapi.json`, and run
   `kv openapi --check`.
3. From this repository, add the signer and route tests, then run the focused
   Vitest file, web TypeScript check, lint, and web build.
4. Update both repositories' durable boundary/configuration documentation.
5. Run each repository's broader verification and review `git diff --check` and
   status separately so unrelated changes are not included.

The completed evidence was:

    Personal: 346 passed, 12 skipped; 4 import contracts kept; OpenAPI check passed.
    Personal audits: Bun, npm, and pip reported no known vulnerabilities.
    Samfunnet: 193 passed, 3 skipped; typecheck, lint, Biome, and build passed.
    Samfunnet audit: 23 pre-existing findings; no dependency changed here.

## Validation and Acceptance

A valid request signed by Samfunnet returns Personal's normal HTTP 201 response.
An unsigned request, a request whose body changes after signing, a stale
timestamp, an invalid signature, or a second request reusing a previously
accepted nonce returns HTTP 401 without calling the volunteer application
service. Missing Personal production configuration prevents startup. Missing
Samfunnet configuration prevents the outbound fetch.

The two implementations must share a fixed test vector with the same expected
`v1=` signature. Personal's focused tests, OpenAPI check, full Ruff/import/test
suite, and dependency audits must pass. Samfunnet's focused Vitest file,
TypeScript check, lint, and production web build must pass.

## Idempotence and Recovery

All source and documentation edits are repeatable. No real secret is written to
the repository. Operators should generate a random value of at least 32 bytes and
store the same value in both Vercel projects. For the initial cutover, deploy
Samfunnet signing first; the old Personal route ignores the added headers. Then
deploy Personal enforcement. For later rotation, put the old value in Personal's
previous-secret variable and the new value in its active variable, deploy
Personal, switch Samfunnet to the new value, verify traffic, then remove the
previous value from Personal.

If rollout cannot be coordinated, revert the code deployments rather than
disabling verification. The route deliberately has no unsigned fallback.

## Artifacts and Interfaces

The protocol is:

    X-Kvarteret-Timestamp: <Unix seconds>
    X-Kvarteret-Nonce: <lowercase UUID>
    X-Kvarteret-Signature: v1=<64 lowercase hexadecimal characters>

The canonical message is six newline-separated lines with no final newline:

    v1
    <timestamp>
    <nonce>
    POST
    /api/v1/volunteer-prospects
    <lowercase SHA-256 hex digest of the exact request body bytes>

The signature is lowercase hexadecimal HMAC-SHA256 over that UTF-8 canonical
message. Both deployments use `VOLUNTEER_PROSPECT_HMAC_SECRET`. Personal may
also use `VOLUNTEER_PROSPECT_HMAC_PREVIOUS_SECRET` during rotation.

Revision note (2026-08-14): Created after verifying both live source paths and
choosing a fail-closed, replay-resistant, rotation-capable HMAC boundary.

Revision note (2026-08-14 10:02Z): Completed both implementations, corrected the
initial rollout order, recorded FastAPI parse ordering and the raw-byte test
vector discovery, and added final verification evidence.
