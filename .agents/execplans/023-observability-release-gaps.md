# Close first-release observability gaps

## Purpose / Big Picture

Make room and karaoke conversion ownership safe during staged deployment without adding consent UI. A booking succeeds independently of telemetry. Personal and website release first; mobile is deferred. Maintain this living plan under `.agents/PLANS.md`.

## Progress

- [x] (2026-09-10) Read current PR #138 source and local Next.js `after` documentation.
- [x] Add explicit per-result legacy/server/disabled ownership and restore legacy browser captures while staging.
- [x] Move conversion delivery to post-response work with bounded transport, strict pseudonymous identity and occurrence validation.
- [x] Execute shared fixtures and regression tests; run typecheck/build and update PR.

## Surprises & Discoveries

Current browser forms emit only UI success while server capture defaults off. Thus the current default loses conversions. The numeric `Result.value` must stay compatible with old clients. The installed Next.js supports `after` for Server Functions; request cookies may be read inside its callback.

## Decision Log

Use optional top-level `analytics_owner` on booking results and a server-only environment mode. Legacy results without metadata retain browser capture; server and disabled results suppress it. Preserve pseudonymous collection without a new opt-in. Keep old-client copies out of canonical server reports using recorded ownership intervals.

## Context and Orientation

`apps/web/src/lib/booking/telemetry.ts` projects room/karaoke outcomes. The submitters under `features/booking/actions` and `features/karaoke/actions` contact Crescat. Their forms currently own UI events. `lib/observability.ts` owns readable logs and must validate a shared occurrence before either sink. PostHog project token is already configured through environment settings. Never use live booking writes for tests.

## Plan of Work

First implement a browser-safe ownership type/helper and additive result metadata. Resolve ownership once when each action starts, pass it into the outcome projector, and return it to the browser. Then schedule server capture through `after`, using a dedicated client with a two-second request timeout and no transport retries. Preserve occurrence UUID and timestamp in the capture payload. Parse only the configured project's cookie, accept UUID identity, and mark absent identity as aggregate. Restore existing Slack environment variable compatibility. Add acceptance tests before updating both branches.

## Concrete Steps

From the repository root run `npm run test --workspace @samfunnet/web`, `npm run typecheck --workspace @samfunnet/web`, and `npm run build:web`. For focused iteration use the web test command with the changed test paths. Tests mock Crescat and analytics; no real messages or bookings are sent.

## Validation and Acceptance

Test both booking kinds, legacy/server/disabled modes, absent old-server metadata, missing or malformed identity, honeypots, duplicate delivery identity, throwing log sink, rejecting analytics sink and post-response capture. The response must stay successful and preserve its numeric provider status. Fixtures must actually run, not just exist as JSON.

## Idempotence and Recovery

Changes are committed to the existing PR branch without rewriting other work. Default ownership remains legacy. Roll back ownership independently of application logs. Never re-submit Crescat writes to recover telemetry.

## Interfaces and Dependencies

Use installed Next.js `after`, PostHog Node `captureImmediate` with `uuid` and `timestamp`, and the existing OTel log SDK. A browser-safe `BookingAnalyticsOwner` union contains legacy, server and disabled. No mobile dependency or new consent preference is added.

## Outcomes & Retrospective

Implementation complete for the Personal and website first release: per-result
ownership, post-response server capture with bounded transport, pseudonymous
identity parsing, shared fixture execution, and the Slack webhook compatibility
restore. Format, lint, typecheck, tests, and the production build pass. Deployed
collector settings, canonical dashboard migration, ownership intervals, and
seven-day reporting validation remain release operations, not claims made by
this PR.
