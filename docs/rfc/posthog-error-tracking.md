# PostHog error tracking proposal

## Status

Proposed.

## Context

The app already sends product analytics to PostHog:

- Client analytics are initialized in both `instrumentation-client.ts` and
  `src/app/providers.tsx`.
- `posthog-node` is available through `src/lib/posthog-server.ts`.
- The app proxies PostHog traffic through `/ingest/*` in `next.config.ts`.
- Server logging is partially wired through OpenTelemetry in `instrumentation.ts`.

PostHog's current Next.js guidance recommends three pieces for error tracking:
client exception capture with the JavaScript SDK, manual capture from App Router
error boundaries, and server-side capture through Next.js `onRequestError`.
PostHog also recommends source map uploads for useful production stack traces.

Sources:

- https://posthog.com/docs/error-tracking/installation/nextjs
- https://posthog.com/docs/error-tracking/capture
- https://posthog.com/docs/logs/installation/nextjs
- https://posthog.com/docs/libraries/next-js
- https://posthog.com/docs/libraries/js/config

## Goals

- Capture unhandled browser exceptions and unhandled promise rejections.
- Capture render errors handled by Next.js App Router error boundaries.
- Capture server-side request errors from route handlers, server components, and
  server actions where Next.js exposes them.
- Preserve privacy: no form payloads, email bodies, Sanity tokens, volunteer
  application details, booking notes, or other sensitive content in error
  properties.
- Connect errors to PostHog sessions where possible without requiring login.
- Keep local development from sending production telemetry by default.
- Make production stack traces readable through source maps.
- Send preview deployment errors to the production PostHog project with
  `environment: "preview"` instead of maintaining a separate preview project.
- Alert on all new production issues, not only booking, volunteer, karaoke, and
  event-submission flows.

## Non-goals

- Replacing application-level success and failure analytics events.
- Adding user identity beyond PostHog's anonymous distinct ID.
- Sending full request bodies, submitted form data, or arbitrary logs to
  PostHog.
- Introducing Sentry or another parallel error-tracking vendor.

## Proposal

### 1. Consolidate client-side PostHog initialization

Use `instrumentation-client.ts` as the single client initialization point because
it matches the current Next.js instrumentation pattern. Remove the second
`posthog.init` call from `src/app/providers.tsx`, but keep `PostHogProvider`
there so client components can continue using PostHog context.

Recommended client config:

```ts
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: "/ingest",
  ui_host: "https://eu.posthog.com",
  defaults: "2026-01-30",
  capture_pageview: true,
  capture_pageleave: true,
  capture_exceptions: {
    capture_unhandled_errors: true,
    capture_unhandled_rejections: true,
    capture_console_errors: false,
  },
  person_profiles: "identified_only",
  tracing_headers: [window.location.hostname],
})
```

`capture_console_errors` should stay disabled initially. React and browser code
often writes expected validation or development noise through `console.error`,
and enabling it can create duplicate or low-signal issues.

### 2. Add App Router error boundaries

Add `src/app/[locale]/error.tsx` for localized route trees. It should:

- Be a client component.
- Call `posthog.captureException(error, properties)`.
- Include safe context only: locale, route segment where available, error
  digest, and `source: "app-router-error-boundary"`.
- Render the existing visual language for recoverable failures with a retry
  button wired to `reset()`.

Add `src/app/global-error.tsx` only if root layout failures are currently
uncovered after testing. Next.js requires global error components to render
`html` and `body`, so it should stay minimal and avoid duplicating the normal
localized layout.

### 3. Capture server request errors in `instrumentation.ts`

Export `onRequestError` from `instrumentation.ts` and forward errors to the
existing `getPostHogClient()`.

Implementation notes:

- Run only when `process.env.NEXT_RUNTIME === "nodejs"`.
- Extract the PostHog anonymous `distinct_id` from the PostHog cookie when
  present, with parsing failures ignored.
- Capture safe request context: route path, method, runtime, route type, router
  kind, and sanitized status metadata if available.
- Do not capture headers wholesale. Do not capture cookies, authorization,
  request bodies, query strings containing user input, or form payloads.
- Use `captureException(error, distinctId, properties)` if supported by the
  installed `posthog-node` version; otherwise pass equivalent properties using
  the SDK-supported signature for this version.

### 4. Add narrow manual captures around handled server failures

The app already emits domain events for booking, karaoke, event submission,
feedback, and volunteer prospect outcomes. Keep those product events, but add
manual exception capture only where an exception is caught and intentionally
converted into a generic user-facing response.

Priority spots:

- `src/features/booking/actions/submit-room-booking.ts`
- `src/features/karaoke/actions/submit-karaoke-booking.ts`
- `src/features/events/actions/submitEvent.ts`
- `src/app/api/volunteer-prospects/route.ts`
- `src/app/api/feedback/route.ts`

Each capture should include a stable workflow name and branch, for example
`workflow: "room_booking"` and `handled: true`, but not user-entered content.

### 5. Source maps and release context

Add a production build step that uploads browser source maps to PostHog after
`next build`. This should be wired only for CI/Vercel production and preview
builds where a source-map upload key is present. PostHog's Next.js source-map
upload uses a personal API key with Error Tracking write access; do not reuse
the wizard-provisioned `POSTHOG_API_KEY` project token that is used for OTLP
Logs.

Add release metadata to captured exceptions:

- Environment: `production`, `preview`, or `development`.
- Vercel deployment URL or environment.
- Git SHA from `VERCEL_GIT_COMMIT_SHA` when available.
- App version if the project later defines one.

Source maps should not be served publicly beyond what Next/Vercel already
requires; if upload tooling requires generated files, keep the generated output
out of git.

Implementation note: source-map upload remains a follow-up until
`@posthog/nextjs-config` can be installed and a dedicated personal upload key is
available in CI. The existing `POSTHOG_API_KEY` is a project token for OTLP Logs
and must not be reused for source-map upload.

### 6. Keep logs separate from exceptions

`instrumentation.ts` currently sends OpenTelemetry logs to PostHog. That can
remain useful, but it should not be the primary error-tracking path.

Decision: keep the existing log wiring as-is during the first exception-tracking
implementation. Do not expand PostHog Logs usage until exception capture,
grouping, source maps, and alerting have been verified in preview and
production.

Follow-up cleanup:

- Keep `POSTHOG_API_KEY` as the wizard-provisioned server-side variable for the
  PostHog project token used by OTLP Logs. Do not replace it with a personal API
  key.
- Add `Content-Type: application/json` to the OTLP exporter headers, matching
  PostHog's logging guidance.
- Export and flush the logger provider for route handlers that emit logs after
  a response, if we decide to rely on PostHog Logs for operational debugging.

## Privacy and security rules

- Never include raw submitted form values.
- Never include cookies, authorization headers, Sanity tokens, or environment
  values.
- Prefer stable enums over free-form messages in custom properties.
- Keep exception messages and stack traces, since those are required for error
  grouping, but avoid wrapping sensitive values into thrown error messages.
- Add tests for any sanitizer that extracts request or cookie metadata.

## Implementation plan

1. Normalize PostHog client initialization into `instrumentation-client.ts`.
2. Add a small `src/lib/posthog/error-context.ts` helper for safe metadata,
   cookie distinct ID extraction, and release properties.
3. Add `src/app/[locale]/error.tsx`.
4. Add `onRequestError` to `instrumentation.ts`.
5. Add manual captures to the highest-value handled server failures.
6. Add source-map upload configuration for production builds.
7. Document required environment variables in the existing deployment docs or
   environment documentation.

## Verification plan

- Unit test the cookie parser and safe metadata helper.
- Add a lightweight component test for the localized error boundary if the
  current test setup supports it.
- Run `npm run lint`.
- Run targeted Vitest tests, then `npm run test` if the change touches shared
  helpers.
- Run `npm run build`.
- In preview or a local telemetry-enabled environment, trigger:
  - a client render error,
  - an unhandled promise rejection,
  - a server route error,
  - one handled workflow exception.
- Confirm exceptions appear in PostHog Error Tracking with useful grouping,
  release metadata, and no sensitive properties.

## Risks

- Duplicate client initialization can cause duplicate events if not removed
  first.
- Automatic capture can produce noisy issues; start with console capture off.
- Serverless functions may exit before telemetry flushes. Keep `flushAt: 1` for
  server exception capture and verify in preview.
- Source-map upload may require a PostHog-specific token or CI setting not
  currently present in the repository.
- Capturing too much request context can leak personal data, so helper functions
  should default to omission.

## Open questions

- Should PostHog Logs be promoted into an explicit operational debugging
  surface after exception tracking is verified, or should it remain a minimal
  supporting signal?
