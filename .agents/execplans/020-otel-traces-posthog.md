# Domain-named OTel spans and cross-system trace propagation (samfunnetibergen + kvarteret-personal)

This ExecPlan is a living document. The sections Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds.

This document must be maintained in accordance with `.agents/PLANS.md`. It spans two sibling repositories that must change together:

- `samfunnetibergen` — Next.js 16 web app (this repo, worktree `apps/web`), repo root `kvarteret/samfunnetibergen`.
- `kvarteret-personal` — FastAPI backend, sibling checkout `kvarteret/kvarteret-personal` (in this environment: `/Users/kluvin/.codex/worktrees/e43f/kvarteret-personal`).

Both repos already export OpenTelemetry (OTel) signals to PostHog. This plan adds (a) explicitly named business-domain spans for the significant daily-use operations, (b) guaranteed trace propagation between the two systems so spans from both land in one trace, and (c) dependency bumps to the latest OTel packages in both repos. Each repo gets its own branch and pull request.

## Purpose / Big Picture

Today both systems export OTel data to PostHog, but the spans that show up are mostly framework noise: Next.js auto-spans named `[POST] /api/v1/volunteer-prospects`, `fetch [POST] https://personal.kvarteret.no/...`, and FastAPI auto-spans named `POST /api/v1/volunteer-prospects`. There is no trace that connects a volunteer registration across the two systems with business meaning.

After this change:

- A visitor submitting the volunteer form on samfunnetibergen produces a single PostHog trace containing a `volunteer.prospect.submit` span (web), a `fetch` span (web, the outbound HTTP call), a `POST /api/v1/volunteer-prospects` span (kvarteret-personal, the inbound HTTP call), and a `volunteer.prospect.register` span (kvarteret-personal, the domain logic), all sharing one `trace_id` with `registration_id` attributes on both sides.
- Other significant daily operations in kvarteret-personal (volunteer application invite/submit/approve/delete/resend, mobile card access-code request and session create, feedback submission, email dispatch) get named spans like `volunteer.application.approve`, `mobile_card.session.create`, `feedback.submit`, `email.delivery.dispatch` (the last already exists).
- Web-to-personal calls that previously did not explicitly propagate trace context (now-playing, feedback) now do, so every span that can be joined into a cross-system trace is joined.
- Both repos use the latest OpenTelemetry packages.

You can verify this in the PostHog UI after deploy (traces view) or locally via the unit tests added by this plan; the local verification path is described in Validation and Acceptance.

## Progress

- [x] (2026-08-19 19:05Z) Created branches `codex/otel-traces-posthog` from latest `origin/develop` in both repos.
- [x] (2026-08-19 19:10Z) Researched both codebases and wrote this ExecPlan.
- [x] (M1) kvarteret-personal: add `with_named_span` helper and wire named spans into volunteer, mobile card, and feedback operations.
- [x] (M1) kvarteret-personal: add unit tests for `with_named_span` and for W3C `traceparent` extraction (cross-system join).
- [x] (M1) kvarteret-personal: bump OTel dependencies to latest in `pyproject.toml`.
- [x] (M2) samfunnetibergen: bump OTel dependencies to latest in `apps/web/package.json` and use semantic-convention constants in `instrumentation.node.ts`.
- [x] (M2) samfunnetibergen: wrap the volunteer-prospect proxy in a `volunteer.prospect.submit` span and update its route test mock.
- [x] (M2) samfunnetibergen: inject trace context into the now-playing and feedback outbound fetches.
- [x] (M3) Run the full test suites in both repos, then commit, push, and open a PR per repo.

## Surprises & Discoveries

- Observation: The `develop` branches in both repos already contain far more OTel wiring than the older branches I inspected first. The web app (`apps/web/instrumentation.node.ts`) already has a `NodeTracerProvider` with an `OTLPTraceExporter` to `https://eu.i.posthog.com/i/v1/traces` plus `HttpInstrumentation`, and `src/lib/observability.ts` already provides `withOperationalSpan`, `injectActiveTraceContext`, `emitOperationalEvent`, and `currentTraceFields`. kvarteret-personal's `app/telemetry.py` already exports spans and logs with a `ParentBased(TraceIdRatioBased(0.1))` sampler (10% root sampling, but fully sampled whenever a sampled parent arrives — exactly right for cross-system traces).
  Evidence: `apps/web/instrumentation.node.ts`, `apps/web/src/lib/observability.ts`, `app/telemetry.py`.
- Observation: Bumping JS OTel to 0.221.0/2.10.0 changed `SimpleLogRecordProcessor` to an options-object constructor (`{ exporter }`); `SimpleSpanProcessor` kept a backward-compatible positional-exporter shim in `sdk-trace-base`. Only the log processor needed updating.
  Evidence: `node_modules/@opentelemetry/sdk-logs/build/src/export/SimpleLogRecordProcessor.d.ts` vs `node_modules/@opentelemetry/sdk-trace-base/build/src/SimpleSpanProcessor-shim.d.ts`.
- Observation: The Python OpenTelemetry SDK forbids setting the global `TracerProvider` more than once per process (`_TRACER_PROVIDER_SET_ONCE`). Tests that install an in-memory exporter must use a single module-scoped fixture rather than per-test `trace.set_tracer_provider` calls.
  Evidence: warning "Overriding of current TracerProvider is not allowed" during the first test attempt.
- Observation: FastAPIInstrumentor 0.65b0 emits two extra `GET /hello http send` ASGI spans per request in addition to the `GET /hello` server span; tests must filter for the server span by name rather than asserting a single span.
  Evidence: in-memory exporter listing showed three spans per TestClient request.
- Observation: `withOperationalSpan` and `injectActiveTraceContext` are already used by the booking flow (`src/features/booking/actions/submit-room-booking.ts` creates a `booking.submit` span; the Crescat client injects trace context) and the volunteer-prospects route injects trace context into its outbound fetch. So the "booking" example in the request is already covered on the web side (booking targets Crescat, a third party, not kvarteret-personal; kvarteret-personal has no booking domain).
  Evidence: `apps/web/src/features/booking/actions/submit-room-booking.ts:182`, `apps/web/src/lib/integrations/crescat/client.ts:35`, `apps/web/src/app/api/volunteer-prospects/route.ts:155`.
- Observation: kvarteret-personal's node_modules-free worktree and stale npm install mean `exporter-trace-otlp-http`, `instrumentation-http`, and `sdk-trace-node` are declared in `apps/web/package.json` but not yet present in `node_modules`; `npm install` (already required for the version bumps) fixes this.
  Evidence: `ls node_modules/@opentelemetry` shows no `exporter-trace-otlp-http`, `instrumentation-http`, or `sdk-trace-node`.
- Observation: The latest OTel versions at the time of writing are: JS `@opentelemetry/api@1.9.1`, `sdk-trace-node@2.10.0`, `sdk-trace-base@2.10.0`, `resources@2.10.0`, `semantic-conventions@1.43.0`, exporters/instrumentation/`api-logs`/`sdk-logs` at `0.221.0`; Python `opentelemetry-api`/`sdk`/`exporter-otlp-proto-http` at `1.44.0`, instrumentation packages at `0.65b0`.
  Evidence: `npm view` and PyPI JSON API queries.
- Observation: Next.js 16 auto-creates spans for route handlers and fetch calls and automatically injects W3C trace context into `fetch` when OTel is configured; the bundled guide (`node_modules/next/dist/docs/01-app/02-guides/open-telemetry.md`) documents the manual `instrumentation.node.ts` pattern this repo already follows. We keep the existing manual wiring and only bump versions, to avoid churn on a working, deployed setup.
- Observation: `ATTR_CLOUD_REGION` is not exported by `@opentelemetry/semantic-conventions@1.43.0`; the resource attribute constant still uses the `SEMRESATTRS_CLOUD_REGION` name.
  Evidence: `node -e "const s=require('@opentelemetry/semantic-conventions'); console.log(s.ATTR_CLOUD_REGION)"` prints `undefined`.
- Observation: Web typecheck failures (`PageProps`/`LayoutProps` not found) are pre-existing on develop and require `next typegen`; they are unrelated to this change (clean baseline has 11 errors, this branch 10, none in touched files). The kvarteret-personal test suite has 146 pre-existing failures when `DATABASE_URL` is unset (environmental); identical counts before and after this change.

## Decision Log

- Decision: Keep the existing manual `NodeTracerProvider` wiring in `apps/web/instrumentation.node.ts` rather than migrating to `@vercel/otel` or `NodeSDK`.
  Rationale: The Next.js docs explicitly support the manual pattern, it already works in production, and the plan's goal is latest packages plus named spans, not a provider rewrite. Date/Author: 2026-08-19 / Pi.
- Decision: Keep `SimpleSpanProcessor` in the web app (synchronous export on span end) and keep `BatchSpanProcessor` in kvarteret-personal.
  Rationale: Next.js has no documented OTel flush hook on request completion in this version; a batch processor risks dropping spans when the serverless process is frozen. kvarteret-personal is a long-running server where batching is safe and already used. Date/Author: 2026-08-19 / Pi.
- Decision: Named domain spans live in kvarteret-personal for the significant operations: `volunteer.prospect.register`, `volunteer.application.invite`, `volunteer.application.submit`, `volunteer.application.approve`, `volunteer.application.delete`, `volunteer.application.resend_invitation`, `mobile_card.access_code.request`, `mobile_card.session.create`, `feedback.submit`, plus the existing `email.delivery.dispatch`. Web gets one new named span, `volunteer.prospect.submit`, wrapping the outbound proxy.
  Rationale: "only significant requests or specific changes" — each span maps to a business operation a user performs daily; lower-volume admin transitions (`start_trial`, `reject`, `reopen`, `restore_volunteer`, `contact`) stay unspanned to keep the signal focused. The auto-instrumented HTTP spans remain because they are the trace's root spans and the join points between systems. Date/Author: 2026-08-19 / Pi.
- Decision: The public prospect registration gets its span at the API endpoint (`volunteer.prospect.register` in `app/api/v1/volunteer_prospects.py`), not also inside the workflow's `register_public_prospect` method, to avoid double-wrapping the same operation.
  Rationale: The endpoint is the single entry point for this operation and already sets `registration_id` on the current span. Date/Author: 2026-08-19 / Pi.
- Decision (revised after review): Wrap workflow method bodies directly with `with with_named_span(...):` rather than splitting each into a public wrapper plus `_<name>_impl` private method.
  Rationale: The `_impl` split changes method structure, stack traces, and patch/mock targets solely for instrumentation; a maintainer review on PR #42 rejected it. Direct wrapping is mechanically simpler even though it re-indents large bodies. `registration_id` attributes land on the named spans via the existing `_record_lifecycle` calls, so no result-derived attributes are lost. Date/Author: 2026-08-19 / Pi (after kvarteret/kvarteret-personal#42 review).
- Decision: Add explicit `injectActiveTraceContext` calls to the web's now-playing and feedback outbound fetches.
  Rationale: Next.js likely injects `traceparent` automatically, but explicit injection matches the house pattern used for volunteer-prospects and Crescat and makes the join deterministic. Date/Author: 2026-08-19 / Pi.

## Context and Orientation

Two sibling repos produce OTel signals to the same PostHog project (`https://eu.i.posthog.com/i/v1/traces` and `/i/v1/logs`). The web app (`kvarteret/samfunnetibergen`, Next.js 16.3.1, npm workspaces; the app lives under `apps/web`) serves the public site and proxies a few requests to the backend (`kvarteret/kvarteret-personal`, FastAPI + Python 3.13, managed with `uv`):

- `POST /api/v1/volunteer-prospects` — public volunteer registration (signed HMAC). Web route: `apps/web/src/app/api/volunteer-prospects/route.ts`; personal endpoint: `app/api/v1/volunteer_prospects.py`.
- `GET /api/now-playing` — Spotify now-playing poll. Web: `apps/web/src/lib/integrations/kvarteret-personal/now-playing.ts`; personal: `app/api/now_playing.py`.
- `POST /api/v1/feedback` — public feedback form. Web: `apps/web/src/app/api/feedback/route.ts`; personal: `app/api/v1/feedback.py`.

Web OTel setup: `apps/web/instrumentation.ts` conditionally imports `apps/web/instrumentation.node.ts` in the Node runtime. `instrumentation.node.ts` builds a `NodeTracerProvider` (resource `service.name: samfunnetibergen`) with a `SimpleSpanProcessor`/`OTLPTraceExporter` and a `LoggerProvider` for logs, then enables `HttpInstrumentation`. The shared observability helpers live in `apps/web/src/lib/observability.ts`: `withOperationalSpan(name, run)` wraps `run` in a named span (marks ERROR on throw), `injectActiveTraceContext(headers)` writes W3C `traceparent`/`tracestate` into an outgoing header map, `emitOperationalEvent(event, fields)` emits an allowlisted OTel log record, and `currentTraceFields()` returns the active `trace_id`/`span_id`.

Personal OTel setup: `app/telemetry.py`'s `configure_telemetry(app, settings)` runs only when `settings.posthog_observability_enabled` is true; it creates a `TracerProvider` sampled by `ParentBased(TraceIdRatioBased(0.1))`, adds a `BatchSpanProcessor`/`OTLPSpanExporter` to `/i/v1/traces`, a log provider with a sanitized handler, and instruments FastAPI and HTTPX. `app/observability.py` provides `current_trace_fields()`, `current_trace_id()`, `emit_event(...)` (allowlisted JSON log events), and a `JsonLogFormatter`. One manual span exists today: `email.delivery.dispatch` in `app/email_outbox_service.py:144`.

Span names follow a `domain.operation` convention. Attributes are domain fields only (`registration_id`, `volunteer_id`, `origin_trace_id`, `booking_submission_id`, ...) — never PII (emails, phones, tokens).

## Plan of Work

### kvarteret-personal changes

1. `pyproject.toml`: bump the five OTel pins to the latest versions: `opentelemetry-api>=1.44.0`, `opentelemetry-exporter-otlp-proto-http>=1.44.0`, `opentelemetry-sdk>=1.44.0`, `opentelemetry-instrumentation-fastapi>=0.65b0`, `opentelemetry-instrumentation-httpx>=0.65b0`. Run `uv sync` afterwards.

2. `app/observability.py`: add a module-level tracer and a `with_named_span` helper. Concretely, near the top (after the existing imports):

   ```python
   _tracer = trace.get_tracer("kvarteret-personal")
   ```

   and at the end of the file:

   ```python
   from contextlib import contextmanager

   @contextmanager
   def with_named_span(name: str, attributes: Mapping[str, object] | None = None):
       """Run the wrapped block inside a named business-domain span.

       The span records ERROR status when the block raises. When telemetry is
       disabled the tracer yields a non-recording span and all calls are no-ops,
       so this helper is safe to use unconditionally.
       """
       with _tracer.start_as_current_span(name) as span:
           for key, value in (attributes or {}).items():
               span.set_attribute(key, value)
           try:
               yield span
           except BaseException:
               span.set_status(trace.Status(trace.StatusCode.ERROR))
               raise
   ```

   (`Mapping` is already imported in this file.) This is a synchronous context manager and works fine around `await` in the async endpoints because `start_as_current_span` itself is synchronous.

3. `app/api/v1/volunteer_prospects.py`: wrap the call to `volunteer_applications_service.create_public_prospect_registration(...)` so the registration runs inside a `volunteer.prospect.register` span. The existing success block already does `span = trace.get_current_span(); span.set_attribute("registration_id", detail.registration_id)` — inside the named span this attribute now lands on the `volunteer.prospect.register` span instead of the HTTP span, which is the desired behavior. Structure:

   ```python
   try:
       with with_named_span("volunteer.prospect.register"):
           detail = await volunteer_applications_service.create_public_prospect_registration(...)
   except VolunteerApplicationFieldValidationError as exc:
       ...
   ```

   (Keep the existing `except` chain unchanged; the helper marks the span ERROR on any raised exception before the `except` block runs.) Import `with_named_span` from `app.observability`.

4. `app/domain/volunteer_applications/workflow.py`: wrap the state-changing methods in named spans by placing the context manager directly around the existing method bodies (re-indenting the body by four spaces inside `with with_named_span(...):`). Apply to: `invite` -> `volunteer.application.invite`, `submit` -> `volunteer.application.submit`, `approve` -> `volunteer.application.approve`, `delete` -> `volunteer.application.delete`, `resend_invitation` -> `volunteer.application.resend_invitation`. Do NOT split methods into `_<name>_impl` helpers: reviewer feedback on PR #42 rejected that pattern because it changes method structure, stack traces, and patch/mock targets purely for instrumentation. Registration-id attributes flow onto the named spans via the existing `_record_lifecycle` calls inside the wrapped bodies, so no explicit `set_attribute` calls are needed. Do not wrap `register_public_prospect` (see Decision Log), `contact`, `start_trial`, `reject`, `reopen`, or `restore_volunteer`.

5. `app/api/v1/mobile_card.py`: wrap the `service.request_access_code(...)` call in `request_access_code` with `mobile_card.access_code.request`, and the `service.create_session(...)` call in `create_session` with `mobile_card.session.create`. Keep the existing `except` chains.

6. `app/api/v1/feedback.py`: wrap `await feedback_service.submit_feedback(...)` with `feedback.submit`.

7. Tests. In `tests/unit/test_observability.py` add:

   - `test_with_named_span_records_named_span_and_attributes`: build a `TracerProvider` with a `SimpleSpanProcessor` over an `InMemorySpanExporter` (from `opentelemetry.sdk.trace.export.in_memory_span_exporter`), set it as the global provider with `trace.set_tracer_provider`, run `with with_named_span("volunteer.prospect.register", {"registration_id": 7}): pass`, restore the previous provider in a `finally`, then assert the exporter returned exactly one span named `volunteer.prospect.register` with attribute `registration_id == 7` and status OK.
   - `test_with_named_span_marks_error_status_on_exception`: same setup, but the block raises; assert the span has `status.status_code == trace.StatusCode.ERROR` and the exception propagates.
   - `test_fastapi_instrumentation_joins_incoming_traceparent`: build a tiny `FastAPI` app with one `GET /hello` handler, call `FastAPIInstrumentor.instrument_app(app, tracer_provider=provider)` with an `InMemorySpanExporter`-backed provider, send `client.get("/hello", headers={"traceparent": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"})` via `fastapi.testclient.TestClient`, and assert the finished server span's `span_context.trace_id == 0x4bf92f3577b34da6a3ce929d0e0e4736`. This test proves that when the web app injects `traceparent`, kvarteret-personal joins the same trace.

8. Run `uv run pytest -q` (or at minimum `uv run pytest tests/unit/test_observability.py`) and confirm green.

### samfunnetibergen changes

9. `apps/web/package.json`: bump OTel deps: `@opentelemetry/api` stays `^1.9.1`; `@opentelemetry/api-logs`, `@opentelemetry/exporter-logs-otlp-http`, `@opentelemetry/exporter-trace-otlp-http`, `@opentelemetry/instrumentation-http`, `@opentelemetry/sdk-logs` to `^0.221.0`; `@opentelemetry/resources`, `@opentelemetry/sdk-trace-base`, `@opentelemetry/sdk-trace-node` to `^2.10.0`; add `@opentelemetry/semantic-conventions` `^1.43.0`. Run `npm install` from the repo root.

10. `apps/web/instrumentation.node.ts`: import the semantic-convention attribute constants and use them in `resourceFromAttributes`:

    ```ts
    import {
      ATTR_CLOUD_REGION,
      ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
      ATTR_SERVICE_INSTANCE_ID,
      ATTR_SERVICE_NAME,
      ATTR_SERVICE_VERSION,
    } from "@opentelemetry/semantic-conventions"
    ```

    replacing the string keys `"service.name"`, `"deployment.environment.name"`, `"service.version"`, `"cloud.region"`, `"service.instance.id"` respectively. No other behavior changes.

11. `apps/web/src/app/api/volunteer-prospects/route.ts`: import `withOperationalSpan` from `@/lib/observability` and wrap the outbound proxy block (from the `fetch(...)` through the `return NextResponse.json(...)` success/error returns inside the `try`) in `withOperationalSpan("volunteer.prospect.submit", async span => { ... })`, setting `span.setAttribute("registration_id", registrationId)` after a successful response. The helper marks ERROR on exceptions, which then flow to the existing outer `catch`. Keep the existing `injectActiveTraceContext(outboundHeaders)` call.

12. `apps/web/src/lib/integrations/kvarteret-personal/now-playing.ts`: build the fetch headers as a mutable object, call `injectActiveTraceContext(headers)` before `fetch`, and keep `Accept: "application/json"`.

13. `apps/web/src/app/api/feedback/route.ts`: before the outbound `fetch(`${PERSONAL_APP_BASE_URL}/api/v1/feedback`, ...)`, inject trace context into its headers object the same way (import `injectActiveTraceContext` from `@/lib/observability`).

14. `apps/web/src/app/api/volunteer-prospects/route.test.ts`: extend the existing `vi.mock("@/lib/observability", ...)` block with `withOperationalSpan` (mirroring the booking test's mock) and assert it was called with the span name `"volunteer.prospect.submit"` on the success path.

15. Run, from the repo root: `npm --workspace @samfunnet/web run typecheck`, `npm --workspace @samfunnet/web run test`, and the lint/format checks used by the repo (`npm run lint:web`, `npx --no-install biome check apps/web` or the repo's `npm run check` equivalent).

### Commits and pull requests

16. Commit each repo separately on its `codex/otel-traces-posthog` branch. Push with `git push -u origin codex/otel-traces-posthog`, then create a PR per repo with `gh pr create` (title e.g. `feat(observability): domain-named OTel spans and cross-system trace propagation`, body summarizing the change, the span inventory, and the verification performed). samfunnetibergen's PR should reference this ExecPlan.

## Concrete Steps

All commands below are run from the repository root shown in the prompt; the personal repo commands run from `/Users/kluvin/.codex/worktrees/e43f/kvarteret-personal`.

Personal repo (kvarteret-personal):

    uv sync
    uv run pytest -q tests/unit/test_observability.py
    uv run pytest -q

Expected: the two new unit tests pass; the full suite stays green (pre-existing failures, if any, are unrelated).

Web repo (samfunnetibergen):

    npm install
    npm --workspace @samfunnet/web run typecheck
    npm --workspace @samfunnet/web run test -- --run src/app/api/volunteer-prospects/route.test.ts src/lib/observability.test.ts
    npm --workspace @samfunnet/web run test

Expected: typecheck exits 0; the volunteer-prospects route test passes with the new `withOperationalSpan("volunteer.prospect.submit")` assertion.

## Validation and Acceptance

- Unit-level (personal): `uv run pytest tests/unit/test_observability.py` passes, including `test_fastapi_instrumentation_joins_incoming_traceparent`, which asserts that an incoming `traceparent` header produces a server span with the matching `trace_id`. This is the concrete proof that web-injected trace context joins the personal trace.
- Unit-level (web): `npm --workspace @samfunnet/web run test` passes; `route.test.ts` asserts the proxy runs inside `withOperationalSpan("volunteer.prospect.submit", ...)`.
- Version-level: `npm ls @opentelemetry/...` in the web workspace and `uv run python -c "import opentelemetry; print(opentelemetry.__version__)"` show the bumped versions.
- PostHog (after both PRs deploy): submit the volunteer form on the live site, then open PostHog -> Traces and look for a trace containing spans from both `samfunnetibergen` and `kvarteret-personal` services, with `volunteer.prospect.submit` (web), the outbound fetch span, `POST /api/v1/volunteer-prospects` (personal), and `volunteer.prospect.register` (personal) all sharing one `trace_id` and a `registration_id` attribute.

## Idempotence and Recovery

- All edits are idempotent text edits; re-running the test commands is safe.
- `npm install` and `uv sync` are additive; if a registry is unreachable, the version bumps can be reviewed without installing (the code changes are compatible with the previously installed versions too).
- If a commit lands before tests pass, amend or add a follow-up commit on the same branch; both PRs are created only after their own test suite passes.
- Rollback: revert each branch to `origin/develop` (`git reset --hard origin/develop`) and close/abandon the PRs; no data migrations or irreversible operations are involved.

## Artifacts and Notes

Final span inventory (kvarteret-personal unless noted):

- `booking.submit` (web, existing) — room booking to Crescat.
- `volunteer.prospect.submit` (web, new) — outbound proxy in `apps/web/src/app/api/volunteer-prospects/route.ts`.
- `volunteer.prospect.register` (personal, new) — `app/api/v1/volunteer_prospects.py`.
- `volunteer.application.invite` / `.submit` / `.approve` / `.delete` / `.resend_invitation` (personal, new) — `app/domain/volunteer_applications/workflow.py`.
- `mobile_card.access_code.request` / `mobile_card.session.create` (personal, new) — `app/api/v1/mobile_card.py`.
- `feedback.submit` (personal, new) — `app/api/v1/feedback.py`.
- `email.delivery.dispatch` (personal, existing) — `app/email_outbox_service.py`.

Auto-instrumented spans (HTTP root spans, Next.js route/fetch spans, HTTPX client spans) remain and act as the trace skeleton and cross-system join points.

## Interfaces and Dependencies

- JS: `@opentelemetry/api@1.9.1`, `@opentelemetry/sdk-trace-node@2.10.0`, `@opentelemetry/sdk-trace-base@2.10.0`, `@opentelemetry/resources@2.10.0`, `@opentelemetry/semantic-conventions@1.43.0`, `@opentelemetry/exporter-trace-otlp-http@0.221.0`, `@opentelemetry/exporter-logs-otlp-http@0.221.0`, `@opentelemetry/instrumentation-http@0.221.0`, `@opentelemetry/api-logs@0.221.0`, `@opentelemetry/sdk-logs@0.221.0`.
- Python: `opentelemetry-api>=1.44.0`, `opentelemetry-sdk>=1.44.0`, `opentelemetry-exporter-otlp-proto-http>=1.44.0`, `opentelemetry-instrumentation-fastapi>=0.65b0`, `opentelemetry-instrumentation-httpx>=0.65b0`.
- New helper signature (personal): `with_named_span(name: str, attributes: Mapping[str, object] | None = None) -> ContextManager[Span]` in `app.observability`.
- Existing helper used (web): `withOperationalSpan<T>(name: string, run: (span: Span) => Promise<T>): Promise<T>` and `injectActiveTraceContext(headers: Record<string, string>): void` in `apps/web/src/lib/observability.ts`.

## Outcomes & Retrospective

- (2026-08-19) Both PRs are implemented and locally verified. kvarteret-personal gained a `with_named_span` helper, nine named business-domain spans, three new tests (including the traceparent-join proof), and OTel 1.44.0/0.65b0 pins. samfunnetibergen gained latest OTel packages, semantic-convention resource attributes, a `volunteer.prospect.submit` span, and trace-context injection on all three web-to-personal fetches.
- (2026-08-19) After review of PR #42, the workflow spans were re-worked from an `_impl` split pattern to the context manager placed directly around the existing method bodies; tests and lint remain green.
- Remaining: deploy both PRs and confirm in PostHog Traces that a volunteer form submission shows the connected `samfunnetibergen -> kvarteret-personal` trace. The 146 kvarteret-personal test failures and 10 web typecheck errors are pre-existing environmental/typegen issues, not introduced here.
- Lessons: the Python OTel global provider is set-once, so test fixtures must be module-scoped; `sdk-logs` 0.221 changed its processor constructors while `sdk-trace-base` kept a compat shim; `@opentelemetry/semantic-conventions` 1.43.0 still names the cloud-region constant `SEMRESATTRS_CLOUD_REGION`. Avoid adding private helper methods solely to host instrumentation; prefer wrapping the existing body directly.

## Revision Log

- 2026-08-19: initial version; scoped named spans to significant daily-use operations, kept auto-instrumentation, chose explicit version bumps over provider rewrites.
- 2026-08-19: implemented M1/M2, recorded surprises (constructor changes, set-once provider, extra ASGI spans, pre-existing failures), updated Progress to complete.
- 2026-08-19: revised workflow span placement per PR #42 review (direct body wrapping instead of `_impl` splits).
