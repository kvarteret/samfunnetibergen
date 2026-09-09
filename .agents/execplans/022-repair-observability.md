# Repair application and platform observability

This living ExecPlan follows .agents/PLANS.md in samfunnetibergen.

## Purpose / Big Picture

Store all produced backend spans, make browser and backend services distinct in PostHog, and capture Vercel failures that happen before application code runs. Verify delivery using safe production GET requests and request identifiers.

## Progress

- [x] 2026-09-08: Inspected both source repositories, production deployment metadata, and PostHog logs.
- [x] 2026-09-08: Isolated BFF changes from the user's unrelated branch using a worktree at the deployed commit.
- [x] Implement and test complete sampling, export lifetime, browser structure, and outbound parent propagation.
- [x] Deploy an authenticated JSON-to-OTLP collector and enable a drain for only the two source projects.
- [x] Run checks, deploy application changes, and verify live log delivery.

## Surprises & Discoveries

Vercel log drains emit JSON rather than OTLP logs. PostHog requires OTLP logs. The reported 413 has no function invocation logs. No drains were configured. Vercel production secrets are redacted on env pull, so the historical OTLP token cannot be validated by reading it locally.

## Decision Log

Use a separate collector project with no database so it cannot feed its own logs back into the drain. Await PostHog ingestion before acknowledging batches; return a failure on ingestion errors so Vercel can retry. Preserve safe structured metadata and redact token URLs and personal details. Use the known analytics project token for BFF exports. Use AlwaysOn samplers even when incoming parents are unsampled, preserving their IDs. Retain browser logs without inventing span IDs for console messages outside a span.

## Outcomes & Retrospective

Production verification succeeded on 2026-09-08. All five services are visible.
Trace 3a3fddf407aaac2bd724f9d5644a2169 contains the Next server request, outbound
fetch, and Personal server child with logs linked to the correct span.
Three empty volunteer form submissions produced issue
01a081bf-472c-7e50-9f6f-bbe9d9245b55 with all three safe field/code histories.
Python checks: 401 passed, 15 skipped. Web checks: 349 passed, 5 skipped;
typecheck, lint and production build passed. Additional span sanitizer tests
cover credentials and preserving timing/correlation.

## Context and Orientation

The Python service is /Users/kluvin/dev/kvarteret/kvarteret-personal. app/telemetry.py configures OpenTelemetry providers and flushes at invocation completion; app/observability.py sanitizes logs. The BFF worktree is /Users/kluvin/dev/kvarteret/samfunnetibergen-observability. apps/web/src/instrumentation.node.ts configures providers and src/lib/observability.ts emits business logs. OpenTelemetry exports logs and spans using HTTP (OTLP). A span is a timed operation with a parent and trace ID.

## Plan of Work

First replace probabilistic sampling and remove duplicate JSON log bodies. In the BFF, use the analytics token, retain export promises with Vercel waitUntil, and inject context inside the volunteer business span. Label browser logs samfunnetibergen-browser and turn recognized SanityLive console text into structured fields. Next add a dependency-free Node collector under tools/vercel-log-drain in the Python repository. Authenticate requests with a secret, accept Vercel JSON records for the two known projects, map safe fields to OTLP, and await ingestion. Deploy the collector as a separate Vercel project before configuring its source drain.

## Concrete Steps

Run uv run pytest tests/unit/test_observability.py in the Python repository. Run npm test, npm run typecheck, npm run lint, and npm run build:web in the BFF worktree. Run node --test in the collector directory. Inspect current Vercel drain configuration before creating or updating it. Store secrets in Vercel environment variables and temporary files only.

## Validation and Acceptance

Tests must prove root and unsampled-parent spans record, OTLP fields remain sanitized, request exports survive response completion, and downstream traceparent contains the business span ID. Collector tests cover authorization, invalid data, redaction, trace IDs, platform 413 severity, and upstream rejection. Production acceptance requires new PostHog entries under distinct browser, BFF, Python, and platform service names, with an actual Vercel request ID in platform log attributes.

## Idempotence and Recovery

Keep original Vercel deployments available for rollback. Reuse the named drain and collector on retries. Never include the collector's project ID among drain sources. Do not acknowledge failed upstream ingestion as successful. Do not include secret values in plans, logs, git, or final responses.

## Artifacts and Notes

Original request: vhq79-1788545598124-7d9fc0b71bcd, 2026-09-04T18:13:18.124Z, HTTP 413, source static. BFF deployed commit cce5053a0b561b3a1851d0e6d818aabb8a56f6ae.

## Interfaces and Dependencies

Keep current OpenTelemetry SDKs and add @vercel/functions for export lifetime. Collector accepts POST JSON batches at /api/logs and authenticates Authorization against VERCEL_DRAIN_SECRET. POSTHOG_PROJECT_TOKEN supplies its ingestion credential; POSTHOG_HOST defaults to the EU ingestion origin. The Personal client-error endpoint adds optional, bounded diagnostic fields; its OpenAPI artifact was regenerated and checked using scripts/export_openapi.py because this checkout has no Makefile.

Revision 2026-09-08: Initial plan after verifying deployment and ingestion boundaries.


Revision 2026-09-08: Resolved production hook discovery by moving server
instrumentation into src, beside src/app. Added @vercel/otel. Fixed admin blank
optional selection 422 responses and excluded CSRF fields from fragment GETs.
Added third-failure issues to four public forms and admin HTMX HTTP failures.
Verified the issue in PostHog with all three histories. Added trace export
redaction and release fallback after inspecting live server spans.
