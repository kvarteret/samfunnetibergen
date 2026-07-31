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
- [x] Review follow-ups: shared client-safe submission copy, one validation
      error-map adapter, cast-free form providers, analytics-safe booking
      success, blank-date filtering, and focused regression tests.
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
- The existing form context alias sits at a React boundary shared by sections
  whose validator generics differ. The follow-up keeps the form value type
  visible, centralizes the unavoidable validator erasure in that alias, and
  removes unsafe double casts from each provider.
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
- The event schema intentionally permits empty additional date rows while at
  least one date is present, so the Sanity document builder must filter those
  rows before persistence. The new action regression test observes the exact
  document passed to the mocked Sanity client.
- TanStack's validator generic parameters are invariant. A shared React form
  context therefore needs one deliberately erased validator boundary; keeping
  that erasure in `src/lib/form-api.ts` removes unsafe double casts from all
  providers without pretending the child sections own validator configuration.

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
- Keep the generic, rate-limit, and invalid-payload user messages together in
  the client-safe `src/lib/submission-messages.ts`; re-export them from the
  server-only submission helper so existing server imports remain stable.
- Use one small `getFormValidationIssues` adapter for all four forms. It merges
  the `onChange` and `onSubmit` Standard Schema error-map slots and de-duplicates
  identical path/message pairs; an additional dependency is not warranted for
  this narrow runtime-shape conversion.
- The volunteer proxy's current camelCase browser request is the supported
  public contract. Legacy snake_case clients, including old browsers, are out
  of scope and do not require a compatibility branch.
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
- Review follow-up suites: 3 test files passed, 5 tests passed, including the
  shared validation adapter and the event document blank-date regression.
- Review follow-up TypeScript and ESLint checks: passed with no errors.

Final repository verification completed:

- Full Vitest coverage run: 49 test files passed, 1 skipped; 299 tests passed,
  3 skipped (302 total).
- Full ESLint: passed.
- Configured Biome format check (`biome format .`): 386 files checked with no
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

Milestones 1–4 now share the intended observable contract. The review follow-up
also keeps all three user-facing submission messages in one client-safe module,
uses one narrow adapter for form validation presentation, removes provider-level
double casts, prevents booking analytics from changing an accepted result, and
keeps blank optional event dates out of Sanity. No remeda dependency was needed.
The volunteer proxy continues to support its current camelCase public request;
legacy snake_case compatibility is intentionally not part of this work.
Remaining work is exactly Milestone 5, which is intentionally not implemented
in this task.

Revision note (2026-07-31): Added the post-review reliability and maintainability
follow-ups after the implementation review identified duplicated error-map
parsers, unsafe provider casts, analytics-induced booking failure, and blank
event date persistence. Added focused regression tests and recorded that legacy
volunteer request compatibility is out of scope per the user's clarification.
