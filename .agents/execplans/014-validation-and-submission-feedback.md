# Make validation and submission feedback reliable across public forms

This living ExecPlan implements the supplied 0014 plan. It follows
`.agents/PLANS.md`. Milestones 1–4 are in scope; Milestone 5 (Slack feedback
and the public feedback API) is intentionally skipped at the user's request.

## Purpose

Every in-scope public form must have one of three durable outcomes: deterministic
invalid input is explained at the affected fields, a server/upstream rejection
remains visible in the form's server-error slot, or success appears only after
the destination accepts the request. No public TanStack form may discard the
`handleSubmit()` promise. Deterministic validation is owned by one Zod schema
per form domain and is reused by the browser and its server boundary.

## Progress

- [x] Characterized the four public TanStack forms, their server boundaries,
      TanStack error-map behavior, and the existing telemetry helpers.
- [x] Milestone 1: room booking raw-state schema, parse-before-rate-limit
      action flow, durable `onServer` feedback, promise observation, and
      booking regression/action tests.
- [x] Milestone 2: karaoke raw-state schema, server-side derivation after
      parsing, durable failure handling, and schema tests.
- [x] Milestone 3: event raw-state schema, TanStack/server validation,
      separate image-upload failure feedback, and raw-state promotion caller.
- [x] Milestone 4: volunteer raw-state schema, form-state group choices,
      parse-before-rate-limit API handling, and removal of applicant email from
      failure telemetry.
- [x] Final source audit: all four public TanStack submit promises are
      observed; Milestone 5 routes remain explicitly out of scope.
- [ ] Milestone 5: Slack feedback and `/api/feedback` — skipped by request.

## Surprises & Discoveries

- The repository had ExecPlans through 013; this 014 file was added from the
  supplied plan so implementation progress and decisions remain reviewable.
- The installed Zod is 3.25.76 even though one existing volunteer route used
  the Zod 4-only `z.email()` API. The route now uses the shared Zod 3/4-safe
  schema instead.
- TanStack Form maps Standard Schema issues into `errorMap.onChange` and
  `errorMap.onSubmit`, while `onServer` must be set explicitly for action or
  route results. The DOM boundary must observe the rejected submit promise.
- The existing form context alias assumes a validator-free concrete form. The
  migrated forms keep the existing context boundary and cast their more
  specific validator instance at the provider boundary; no shared form helper
  was introduced.
- The installed TanStack Form inference leaves the manually populated
  `onServer` slot typed as `undefined` when no server validator is configured.
  The forms therefore use the documented `setErrorMap` API with a narrow value
  cast; they do not import or reproduce TanStack's internal validator types.
- Event image upload remains a separate server action. Its validation and
  upstream failure are surfaced through the event form's `onServer` slot before
  the success state can be reached.
- Success analytics and success-response JSON parsing are isolated from the
  destination write. A PostHog failure cannot turn an accepted booking,
  Sanity document, or Personal registration into a visible submission failure.

## Decision Log

- Use `z.input<typeof schema>` for browser-state types and keep normalized
  Crescat, Sanity, and Personal request shapes at their existing integration
  boundaries.
- Use TanStack's native `validators.onChange`, `validators.onSubmit`,
  `form.setErrorMap({ onServer })`, `isSubmitting`, and
  `isSubmitSuccessful`; do not add a form framework or dispatch abstraction.
- Parse deterministic input before the normal rate limiter, then perform
  availability, duplicate, configuration, and upstream checks separately.
- Emit only value-free validation diagnostics (`form_id`, stage, branch, issue
  count, paths, codes, status, and safe feature flags) through the existing
  PostHog submission helper.
- Keep Milestone 5 unchanged. Slack feedback and `/api/feedback` are recorded
  as remaining work, not as an accidental omission.

## Implementation Notes

In scope:

- Room booking: `src/features/booking/domain/bookingFormSchema.ts`,
  `BookingForm.tsx`, and `submit-room-booking.ts`.
- Karaoke booking: `src/features/karaoke/domain/karaokeFormSchema.ts`,
  `KaraokeForm.tsx`, and `submit-karaoke-booking.ts`.
- Event submission: `src/features/events/domain/eventFormSchema.ts`,
  `EventForm.tsx`, `submitEvent.ts`, and `submitPromotionEvent.ts`.
- Volunteer signup: `src/features/grupper/domain/volunteerFormSchema.ts`,
  `GroupVolunteerForm.tsx`, and `/api/volunteer-prospects`.

The shared `getValidationDiagnostics` function in `src/lib/submission.ts`
converts schema issues to stable, value-free telemetry. Existing UI components
(`ErrorSummary`, `FieldGroup`, `useFormErrors`, and `useFieldAria`) remain in
use. Availability/opening-hours checks, Crescat price derivation, image upload,
Sanity writes, and Personal forwarding remain separate server concerns.

## Verification

Focused verification completed:

- Booking action suite: 7 tests passed.
- Schema, promotion, and volunteer route suites: 24 tests passed.
- Targeted ESLint: no errors; one unused-variable warning was removed.

Final repository verification completed:

- Full Vitest coverage run: 47 test files passed, 1 skipped; 296 tests passed,
  3 skipped.
- Full ESLint: passed.
- Configured Biome format check (`biome format .`): 383 files checked with no
  changes.
- TypeScript (`tsc --noEmit`): passed.
- Production build (`next build`): compiled, type-checked, and generated all
  76 static pages successfully.
- `git diff --check`: passed.
- Final source audit: every in-scope `form.handleSubmit()` call is observed
  with `void ...catch(...)`; Slack feedback and `/api/feedback` remain
  unchanged.

The environment did not provide `npm` on `PATH`, so the equivalent installed
runtime binaries were invoked directly; the repository's configured lint and
build operations themselves passed.

The first attempted Biome `--check` flag was unsupported by this installed
Biome version; the repository-configured `biome format .` verification passed.

## Outcomes & Retrospective

Milestones 1–4 now share the intended observable contract. No custom form or
telemetry abstraction was needed. The final implementation keeps normalized
integration payloads behind raw-state schemas, moves deterministic validation
ahead of rate limiting, preserves expected server messages in `onServer`, and
keeps destination success independent of analytics availability. Remaining
work is exactly Milestone 5, which is intentionally not implemented in this
task.
