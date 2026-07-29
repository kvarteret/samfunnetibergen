# Focus recurring-series generation on academic semesters

This ExecPlan is a living document. The sections Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds.

This repository's ExecPlan rules live in `.agents/PLANS.md`. This document must be maintained in accordance with those rules.

## Purpose / Big Picture

Editors currently run one Studio action that expands a recurring series from its first date through a fixed six-month horizon. That horizon can cross program boundaries, and rerunning the action cannot clearly target the next program period. After this change, the action first shows compact semester choices such as `V26`, `H26`, `V27`, and `H27`. Selecting one previews and creates only the occurrences in that program window.

The spring `VYY` semester is January 3 through May 29. The autumn `HYY` semester is August 17 through December 15. The first date anchors recurrence and supplies the copied times, the stored iCalendar recurrence rule describes cadence, and the selected semester is the sole expansion boundary.

## Progress

- [x] (2026-07-29 12:00Z) Verified the current generation domain, Studio action, recurrence editors, query behavior, and six-month cap.
- [x] (2026-07-29 15:03Z) Added semester-window domain helpers and range-based recurrence expansion with unit tests; 25 focused tests pass.
- [x] (2026-07-29 15:05Z) Added the semester picker and semester-scoped reconciliation to the Studio generation action; TypeScript accepts the new `.tsx` action.
- [x] (2026-07-29 15:08Z) Updated editorial copy and ADR 005 so Studio behavior is described as explicit semester generation.
- [x] (2026-07-29 15:12Z) Ran focused tests (25 passed), full TypeScript checking, targeted Biome checking, and the production Studio build; all passed.
- [x] (2026-07-29 15:16Z) Verified the initial calendar-half Studio flow against the existing Quiz series without writing.
- [x] (2026-07-29 16:34Z) Applied and verified the corrected program dates: `VYY` January 3–May 29 and `HYY` August 17–December 15. Tests, TypeScript, formatting, and the Studio build pass; the live `H26` preview showed the correct dates and no writes were made.
- [x] (2026-07-29 17:20Z) Consolidated the date model so the seed date anchors recurrence, the RRULE stores cadence only, and the selected semester is the sole expansion boundary.
- [x] (2026-07-29 17:20Z) Removed count/until controls from both recurrence editors and made existing finite RRULEs expand according to the selected semester.
- [x] (2026-07-29 17:20Z) Moved the administrative generation script from its legacy six-month window to the same semester-window domain.
- [x] (2026-07-29 18:43Z) Re-ran 28 focused tests, full TypeScript checking, Sanity TypeGen, the production Studio build, and a non-writing live UI preview for the consolidated model.
- [x] (2026-07-29 19:00Z) Moved semester expansion from the document action menu into the primary recurrence panel, removed the duplicate menu entry, and re-ran the live non-writing `H26` preview.

## Surprises & Discoveries

- Observation: The existing “series needing regeneration” queue is rolling, but generation is anchored to the original seed date plus six months. Rerunning the unchanged rule therefore cannot extend the horizon.
  Evidence: `src/features/events/domain/instances.ts` computes `addMonths(dtstart, 6)`, while `src/studio/components/ArrangementBrowser.tsx` checks for children at least eight weeks from today.
- Observation: Reconciliation currently fetches every child of a series. A semester-focused plan must also restrict existing children to the selected semester or dates from other semesters will be mislabeled as orphans.
  Evidence: The former `EXISTING_DAYS_QUERY` in `src/studio/actions/generateSeriesDaysAction.ts` filtered only by parent id.
- Observation: The Studio action was a `.ts` file and could not contain the semester-picker dialog markup.
  Evidence: The first `npx tsc --noEmit` reported JSX parse errors; moving the implementation to `generateSeriesDaysAction.tsx` resolved them.
- Observation: The existing Quiz series is a useful non-mutating acceptance fixture because it already has generated `H26` children.
  Evidence: With the corrected boundary, its live `H26` preview reported `2026-08-17–2026-12-15`, 18 matching days, 0 creations, and no orphaned children.
- Observation: Date range authority is currently duplicated. `dates[0]` supplies the seed, RRULE can contain `COUNT` or `UNTIL`, the Studio action supplies a semester range, and the administrative script supplies a separate six-month range.
  Evidence: `src/studio/components/RecurringInput.tsx`, `src/features/events/domain/recurrence.ts`, `src/studio/actions/generateSeriesDaysAction.tsx`, and `scripts/generate-event-instances.ts`.

## Decision Log

- Decision (superseded): Treat `VYY` as January 1–June 30 and `HYY` as July 1–December 31.
  Rationale: This initial assumption was replaced by the user-provided program dates.
  Date/Author: 2026-07-29 / Codex
- Decision: Treat `VYY` as January 3–May 29 and `HYY` as August 17–December 15.
  Rationale: These are the corrected program boundaries supplied by the user. Dates in the winter and summer gaps still map to their surrounding half-year when centering the picker.
  Date/Author: 2026-07-29 / User and Codex
- Decision (superseded): Keep RRULE count and until limits authoritative, intersecting them with the chosen semester.
  Rationale: This initially preserved submitter intent, but left the editor with two competing and visually adjacent end boundaries. It was replaced by the cadence-only RRULE model below.
  Date/Author: 2026-07-29 / Codex
- Decision: Show one previous semester, the current relevant semester, and two following semesters. If the seed is in the future, use its semester as the relevant semester.
  Rationale: This produces the requested compact sequence (for July 2026: `V26`, `H26`, `V27`, `H27`) while still supporting series whose first date is later than today.
  Date/Author: 2026-07-29 / Codex
- Decision: Scope reconciliation to the selected semester.
  Rationale: Each run must be independently safe and must never classify valid children in other semesters as obsolete.
  Date/Author: 2026-07-29 / Codex
- Decision: RRULE stores cadence only; it no longer stores `COUNT` or `UNTIL`. The seed date is the first possible occurrence and the selected `VYY`/`HYY` window is the only expansion boundary.
  Rationale: Editors otherwise set two competing end boundaries and cannot predict which dates a selected semester will create. Cadence, anchor, and materialization window become three distinct concepts with one authority each.
  Date/Author: 2026-07-29 / Codex
- Decision: Existing RRULE `COUNT` and `UNTIL` values are ignored during materialization, and are removed the next time an editor changes cadence.
  Rationale: Hiding the controls without neutralizing stored values would leave an invisible cutoff. Generated child documents remain unchanged unless an editor explicitly confirms a semester generation.
  Date/Author: 2026-07-29 / Codex
- Decision: Place semester expansion directly beside the recurrence pattern in the primary date view and remove its document-menu action.
  Rationale: Pattern and expansion are two parts of one editor workflow. A hidden action menu made the second part difficult to discover and created an unnecessary second navigation model.
  Date/Author: 2026-07-29 / User and Codex

## Outcomes & Retrospective

Editors can expand a series one program semester at a time from the same primary panel where they edit its recurrence. The first date anchors the pattern, recurrence captures cadence only, and the chosen semester exclusively controls materialization. The live Studio no longer shows a separate series end-date input, an “Add item” action after the single seed exists, or a hidden generation entry in the document menu. Its primary picker shows exact `VYY` and `HYY` ranges, and the existing Quiz series previewed 18 matching `H26` days with no creates or orphans. The preview was cancelled, so no Sanity documents were written.

## Context and Orientation

Recurring series are Sanity `arrangement` documents with `eventKind: "seriesParent"`. The parent stores a first date and an RRULE string. `src/features/events/domain/instances.ts` expands that rule into concrete occurrences and builds deterministic `seriesInstance` child documents. `src/studio/components/SeriesSemesterExpansion.tsx` is the editor-facing control that previews a diff and creates missing children from the primary recurrence panel. Public listings and `/api/events/feed` read those concrete children; they do not expand the rule.

The recurrence package computes a cadence sequence from the original first date. Materialization removes legacy `COUNT` and `UNTIL` options before asking for occurrences between a semester's first and last day, preserving recurrence alignment without an invisible cutoff.

## Plan of Work

Extend `src/features/events/domain/instances.ts` with a plain `SemesterWindow` value carrying label, start date, and end date. Add helpers that map a calendar date or code to a semester, enumerate nearby semesters, test whether a date belongs to a window, and expand an RRULE inside an explicit window. Use this explicit range primitive in both Studio and the administrative script.

Place the semester-choice and confirmation dialogs in `src/studio/components/SeriesSemesterExpansion.tsx`, rendered by `RecurringInput.tsx`. Selecting a semester computes occurrences only inside that semester, fetches only existing children whose dates fall inside it, and then opens the confirmation step with the semester label included. Remove the document-menu action so there is one editor entry point. No existing child is overwritten or deleted.

Change both recurrence editors, Studio help text, and the materialized-instance ADR so RRULE captures cadence without count or end-date controls. Existing stored `COUNT` and `UNTIL` values are ignored during materialization and stripped when Studio next edits cadence.

## Concrete Steps

From `/Users/kluvin/dev/kvarteret/samfunnetibergen`, edit the domain and Studio components, then run:

    npx vitest run src/features/events/domain/instances.test.ts src/features/events/domain/recurrence.test.ts src/studio/components/RecurringInput.test.ts
    npx tsc --noEmit
    npx biome check src/features/events/domain/instances.ts src/features/events/domain/instances.test.ts src/studio/components/RecurringInput.tsx src/studio/components/SeriesSemesterExpansion.tsx
    npm run studio:build

The focused tests should pass semester boundaries, label ordering, cadence serialization, legacy COUNT/UNTIL removal, and rerun safety scenarios. Type checking and the Studio build should exit successfully.

## Validation and Acceptance

On July 29, 2026, the primary recurrence panel for a valid series includes “Velg semester og kontroller dager”. Opening it shows `V26`, `H26`, `V27`, and `H27`. Selecting `H26` previews only occurrences from August 17 through December 15, 2026. Existing children in other semesters are absent from the orphan counts. Confirming creates only missing `H26` children. Reopening the control and choosing `H26` again reports zero new children.

A legacy rule with `COUNT` or `UNTIL` expands for the full chosen semester because those obsolete range options are ignored. New rules contain cadence only. Any supported rule can be expanded one semester at a time without an original-seed-plus-six-month ceiling.

## Idempotence and Recovery

Generated child ids remain deterministic and writes use `createIfNotExists`, so retrying the same semester is safe. The control does not delete or overwrite children. Closing either dialog makes no writes. Studio and the administrative script use the same explicit semester windows.

## Artifacts and Notes

The central user-visible labels are the semester codes themselves. The preview shows the exact start and end dates, avoiding assumptions about what the letters stand for.

## Interfaces and Dependencies

In `src/features/events/domain/instances.ts`, export a `SemesterWindow` type and the pure functions `semesterForCode(code: string)`, `semesterForDate(date: string)`, `semesterWindowsAround(date: string, before?: number, after?: number)`, and `expandOccurrencesInRange(rrule: string, seed: GenerationSeed, range: Pick<SemesterWindow, "startDate" | "endDate">)`. Continue using the existing `rrule` dependency. The Studio semester component and administrative script consume these helpers, and the component passes the selected window's start and end dates to its GROQ query.

Revision note (2026-07-29): Initial plan created after tracing the current fixed-horizon implementation and identifying the cross-semester orphan-classification risk.

Revision note (2026-07-29): Updated after implementing the domain model, semester picker, semester-scoped query, and source-backed ADR changes. Final Studio build validation remains.

Revision note (2026-07-29): Completed after all automated checks passed and the existing Quiz series verified the non-mutating `H26` preview in Studio.

Revision note (2026-07-29): Reopened to replace the initial calendar-half assumption with the corrected user-supplied `VYY` and `HYY` program dates.

Revision note (2026-07-29): Completed again after verifying `V26`, `H26`, `V27`, `H27` ordering and the exact `H26` August 17–December 15 preview in the live Studio.

Revision note (2026-07-29): Reopened after the Studio screenshot revealed competing seed, RRULE-end, semester, and script windows. The plan now consolidates range authority in the semester selector.

Revision note (2026-07-29): Completed the consolidated date model after focused tests, TypeScript, TypeGen, the Studio build, and a non-writing live `H26` preview all passed.

Revision note (2026-07-29): Reopened to move semester expansion from the document action menu into the primary recurrence view.

Revision note (2026-07-29): Completed after the primary control, semester picker, non-writing `H26` preview, and removal of the old document-menu entry were verified in the live Studio.
