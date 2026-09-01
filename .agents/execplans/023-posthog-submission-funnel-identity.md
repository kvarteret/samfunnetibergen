# Restore PostHog submission funnel identity

This ExecPlan is a living document. The sections Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date in accordance with `.agents/PLANS.md`.

## Purpose / Big Picture

The public booking and submission forms currently record their successful `*_submitted` analytics events in server code with the fixed PostHog identity `anonymous`. That identity cannot be joined to the real visitor who recorded the corresponding browser-side `*_started` event, so PostHog funnels undercount or show no conversion. After this change, each successful submission event will be emitted once from the browser after the server operation succeeds, where the existing PostHog browser session identity is available. The event will keep useful, non-sensitive properties, and server-side operational failure telemetry will remain server-side.

The same review will document and test what `form_validation_failed` reveals. It must continue to expose field names and counts without validation messages or entered values. A human can verify the result by running the focused tests and by observing that the four server implementations no longer emit successful funnel events while the four client forms do so only after a successful server response.

## Progress

- [x] (2026-09-01) Read repository guidance and Next.js App Router guidance.
- [x] (2026-09-01) Traced the four client forms, four server submission paths, and validation telemetry.
- [x] (2026-09-01) Add browser-side success events for karaoke, volunteer, and event submissions with stable non-sensitive properties; also exclude honeypot successes from room and karaoke funnel counts.
- [x] (2026-09-01) Remove anonymous server-side `*_submitted` events and their now-unused imports while preserving operational telemetry.
- [x] (2026-09-01) Add or update focused tests for the server no-duplicate contract and confirm validation metadata coverage.
- [x] (2026-09-01) Run the final source/privacy audit and verify the clean PR branch with 280 passing web tests, route type generation, typecheck, lint, and diff checks.
- [ ] Push the PR branch, create the pull request, and record its URL.

## Surprises & Discoveries

- Observation: Room booking already emits `room_booking_submitted` in the browser after `submitRoomBooking` resolves successfully, but the server also emits a duplicate with `distinctId: "anonymous"`.
  Evidence: `apps/web/src/features/booking/components/BookingForm.tsx` captures the event in the form action; `apps/web/src/features/booking/actions/submit-room-booking.ts` captures it again with the fixed identity.
- Observation: Browser validation telemetry is already value-free and identifies which fields failed.
  Evidence: `apps/web/src/lib/posthog/form-validation.ts` sends normalized field paths, a distinct invalid-field count, and total validation issue count; its test explicitly rejects messages and entered values.
- Observation: Server schema failures have richer diagnostics than browser failures, but they are sent through exception capture rather than the `form_validation_failed` event.
  Evidence: `apps/web/src/lib/submission.ts` reduces schema issues to `issue_count`, sorted `field_paths`, and sorted `issue_codes` before `captureSubmitFailure`.
- Observation: The volunteer route's accepted response already contains the registration ID, so the browser can retain that useful property without passing a PostHog identity to the server.
  Evidence: `GroupVolunteerForm.tsx` reads the successful JSON response after the status check and conditionally includes only `registration_id` in the client event.
- Observation: Refreshing `next typegen` alone did not remove an old deleted-route validator from `.next`; moving the ignored generated cache aside and regenerating fixed web typecheck without a source change.
  Evidence: the first typecheck referenced `.next/{dev/,}types/validator.ts` and deleted `arrangementer/kalender/page.js`; after the generated cache was moved aside, `npm run route-typegen` and `npm run typecheck:web` passed.

## Decision Log

- Decision: Use browser-side capture for successful submission funnel events rather than passing a PostHog distinct ID through request bodies.
  Rationale: All four forms are client components and already have the existing PostHog browser instance; this avoids trusting or persisting a client-supplied identity in server payloads and matches the working half of the room-booking implementation.
  Date/Author: 2026-09-01 / Codex.
- Decision: Keep the server-side operational events and failure captures.
  Rationale: They support backend reliability and cross-system diagnostics independently of the user funnel and do not cause the funnel identity mismatch.
  Date/Author: 2026-09-01 / Codex.
- Decision: Keep the existing privacy-safe validation metadata and add coverage only where needed.
  Rationale: The current implementation already answers which fields failed without sending entered values or validation messages; changing its shape would create unnecessary analytics drift.
  Date/Author: 2026-09-01 / Codex.

## Outcomes & Retrospective

Implementation is complete locally on the clean PR branch. New successful funnel events are emitted from the browser for all four flows, anonymous server-side funnel duplicates are removed, and the validation event remains useful and value-free. The clean branch is verified with 280 passing tests and 5 expected skips, route type generation, web typecheck, web lint, and `git diff --check`. Record the final PR reference and any remaining limitation such as historical anonymous events not being repairable retroactively after the remote PR is created.

## Context and Orientation

This is a Next.js 16 App Router web application under `apps/web`. `BookingForm.tsx`, `KaraokeForm.tsx`, `GroupVolunteerForm.tsx`, and `EventForm.tsx` are client components. They call server actions or a route handler to perform the durable operation, then display success based on the form state. The server implementations are `submit-room-booking.ts`, `submit-karaoke-booking.ts`, `submitEvent.ts`, and `app/api/volunteer-prospects/route.ts`.

PostHog has two relevant clients. `posthog-js` in a client component uses the browser visitor identity and is suitable for funnel events. `posthog-node`, exposed through `apps/web/src/lib/posthog-server.ts`, runs on the server and has no browser visitor identity unless one is explicitly supplied. The current successful server captures pass `distinctId: "anonymous"`, which is the bug. `apps/web/src/lib/observability.ts` operational events and `apps/web/src/lib/submission.ts` failure captures are separate backend telemetry and should remain intact.

`apps/web/src/lib/posthog/form-validation.ts` is the shared browser helper for `form_validation_failed`. It receives TanStack Form error maps, deduplicates and normalizes indexed field paths such as `dates[0].startDate` to `dates[].startDate`, and sends only the form ID, field names, and counts. `apps/web/src/lib/submission.ts` provides server-side value-free diagnostics for schema failures.

## Plan of Work

First, add a `posthog.capture` call in each of the karaoke, volunteer, and event client form submission handlers immediately after the server operation has returned success. Use properties already available in each client form and avoid names, email addresses, free text, or other submitted values. Preserve the room event’s existing browser capture and align its property shape if the tests or funnel contract show that is needed.

Next, delete only the successful `*_submitted` PostHog captures from the four server paths. Keep imports that are still used for `captureSubmitFailure` or other server behavior. This ensures each accepted submission generates one funnel event with the browser’s identity and does not generate a second anonymous event.

Then, add focused tests around the shared analytics contract or form handlers where the repository’s test setup permits it. At minimum, update server action/route tests so a successful server operation proves it does not call the server PostHog capture for a funnel submission. Extend the validation helper test only if the existing assertions do not clearly prove the metadata requested by the user.

Finally, run the narrow web tests covering submission actions, the validation helper, and route behavior, followed by web typecheck and lint. Review the diff for accidental personal data in analytics properties, create a branch/commit suitable for review, push it, and open a GitHub pull request if the authenticated remote permits it.

## Concrete Steps

Run all commands from `/Users/kluvin/dev/kvarteret/samfunnetibergen`.

Inspect the starting state before edits:

    git status --short --branch
    rg -n "(room|karaoke|volunteer|event).*submitted|form_validation_failed" apps/web/src

After editing, run the focused test suite:

    npm --workspace @samfunnet/web exec vitest run src/lib/posthog/form-validation.test.ts src/features/booking/actions/submit-room-booking.test.ts src/features/karaoke/actions/submit-karaoke-booking.test.ts src/features/events/actions/submitEvent.test.ts src/app/api/volunteer-prospects/route.test.ts

Then run static checks for the changed web application:

    npm run typecheck:web
    npm run lint:web

Review the final event locations and diff:

    rg -n -C 3 "(room|karaoke|volunteer|event).*submitted|form_validation_failed" apps/web/src
    git diff --check
    git diff --stat
    git diff

If all checks pass and unrelated worktree changes remain untouched, commit only the files belonging to this change, push the new `codex/` branch, and create the pull request with a summary of the identity fix and validation metadata. The completed clean-branch verification is `npm --workspace @samfunnet/web run test` (280 passed, 5 skipped), `npm run route-typegen`, `npm run typecheck:web`, `npm run lint:web`, and `git diff --check`.

## Validation and Acceptance

The focused tests must pass. A successful server action or volunteer route response must not call the server PostHog client for `room_booking_submitted`, `karaoke_booking_submitted`, `event_submission_submitted`, or `volunteer_application_submitted`. Each corresponding client form must call `posthog.capture` only after its server operation succeeds, so failed, rate-limited, honeypot, and client-invalid submissions do not count as successful funnel conversions.

The validation test must demonstrate that `form_validation_failed` includes the form ID, normalized invalid field names, distinct invalid-field count, and total issue count, while excluding validation messages and entered values. Server schema failure diagnostics must remain value-free and include field paths and issue codes through the existing exception-capture path.

Historical anonymous events cannot be reassigned retroactively by this code change. The expected improvement applies to new successful submissions after deployment; PostHog funnels may need a date filter or a new cohort boundary when evaluating the corrected data.

## Idempotence and Recovery

The code changes are additive/removal-only telemetry changes and are safe to re-run. Do not modify the unrelated untracked ExecPlans or ADR in the worktree. If a test or lint change is unrelated to these files, leave it untouched and report it. If the PR push or creation fails, keep the local commit and report the exact branch and commit so the user can retry without losing work.

## Artifacts and Notes

The important implementation proof is the absence of successful funnel captures from server-only files and the presence of post-success browser captures in all four client form components. The validation proof is `form-validation.test.ts`, whose passing assertion shows field names and counts but no messages or entered values. The final review must include the PR URL and note that historical anonymous events cannot be reassigned retroactively.

## Interfaces and Dependencies

Use the existing `posthog-js` default import in the client form components and the existing event names:

    room_booking_submitted
    karaoke_booking_submitted
    volunteer_application_submitted
    event_submission_submitted

Use the existing `captureInvalidFormSubmission(formId, ...errorMaps)` helper for browser validation telemetry. Do not introduce a new PostHog SDK, server identity propagation field, or cross-repository API contract for this fix.

Plan revision note (2026-09-01): created after source inspection; the initial investigation confirmed that room booking already contains the desired browser-side pattern and that validation metadata is already useful and privacy-safe.

Plan revision note (2026-09-01): recorded implementation completion, the volunteer response-property decision, the generated Next validator cache issue and recovery, and the passing full web verification before the PR step.

Plan revision note (2026-09-01): replayed the implementation onto `origin/develop` so the PR branch contains only this one change, resolved the expected conflicts against the newer base telemetry shape, and verified the clean branch with 280 passing web tests and 5 skips.
