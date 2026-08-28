# Focus direct room bookings and make the English booking route Safari-safe

This ExecPlan is living documentation for the implementation of the direct-room booking experience and the Safari translation crash reported in PostHog. It must be maintained in accordance with `.agents/PLANS.md`.

## Purpose / Big Picture

When someone opens a room page and clicks its “book this room” action, the booking form should keep that room visually primary instead of making the person scan every room again. Other rooms remain available through an expandable “add another room” section. The English booking route must also render English interface copy so Safari does not translate Norwegian text inside an English document and mutate React-managed DOM nodes. The locale error boundary should avoid treating the known browser DOM mutation as a useful application exception while preserving normal error reporting.

The behavior is visible at `/nb/rom/teglverket`: click “Book Teglverket her”, choose a date and time, and confirm that Teglverket is the only primary room card; expand the additional-room control to reveal the other rooms. The same route under `/en` should contain English application copy and `lang="en"`.

## Progress

- [x] (2026-08-28) Read repository guidance, the current booking implementation, the linked PostHog report, the live Teglverket route, and the installed Next.js App Router guidance.
- [x] (2026-08-28) Confirmed the direct booking query parameter is `room=<Crescat room id>` and that the current picker renders every room as a full card after date/time selection.
- [x] (2026-08-28) Add locale-aware application messages for the room booking route and use them in server and client booking UI.
- [x] (2026-08-28) Pass locale-specific calendar and phone labels into shared booking controls.
- [x] (2026-08-28) Add focused-room rendering with an expandable additional-room picker while preserving normal all-room behavior for `/rom/book` without a room query.
- [x] (2026-08-28) Harden locale error reporting for the known Safari DOM mutation and remove the unused `TermsDialog` prop.
- [x] (2026-08-28) Add or update focused tests, run source-specific verification, and perform a local/live route smoke check.

## Surprises & Discoveries

- Observation: The direct room action already supplies the correct preselection input.
  Evidence: `apps/web/src/app/[locale]/rom/[slug]/page.tsx` renders `/rom/book?room=${room.crescatRoomId}`, and `BookRoomPage` converts that query value to `initialRoomId`.
- Observation: The current production booking picker only appears after a date and time are selected, and then renders all rooms even when one was preselected.
  Evidence: the live `/nb/rom/book?room=97` page showed Teglverket plus every other available/occupied room after selecting 28 August 2026.
- Observation: The linked PostHog report is a separate but related booking-route defect, not the direct-room layout request alone.
  Evidence: the report is titled “Stop Safari translation from crashing /en/rom/book” and identifies hardcoded Norwegian copy in the English route plus a `DOMException: NotFoundError` during React DOM removal.
- Observation: The booking route has hardcoded Norwegian copy in nearly every client section and in the date/time controls; localizing only the page heading would leave the same language mismatch.
  Evidence: `rg` found Norwegian labels and messages in `BookingForm.tsx`, every booking form section, `date-time-picker.tsx`, and the booking-specific domain validation messages.
- Observation: The room page's supporting Sanity sections use Norwegian fallback content when an English translation is unavailable.
  Evidence: `roomsPageQuery` selects the requested language and falls back to Norwegian, and the live English booking page displayed Norwegian “Slik booker du” content. This implementation will localize application-owned copy and retain editor-owned fallback content rather than inventing Sanity translations in code.
- Observation: Exact localized lookup by the schema's Norwegian error text was too brittle for a multilingual route.
  Evidence: `translateValidationMessage` initially switched on complete Norwegian sentences; the schema now emits stable `validation.*` IDs and the presentation helper translates those IDs, while preserving a fallback for unknown issues.
- Observation: The focused-room disclosure works with live booking data on the local app.
  Evidence: `/nb/rom/book?room=97` rendered only Teglverket as the primary card; the closed “Legg til flere rom” control expanded to show Maos Lille Røde, Speilsalen, Stillhet, Storelogen, Støy, and Tivoli. The `/en` route rendered `lang="en"` and English booking application copy.

## Decision Log

- Decision: Keep `initialRoomId` as the single signal for the focused-room layout and do not change the public room-page URL.
  Rationale: the existing query parameter is already validated against the fetched bookable rooms and is the narrowest compatible input for both direct links and server-rendered form defaults.
  Date/Author: 2026-08-28 / Codex.
- Decision: Render the selected room in the existing full card component and put only non-selected rooms inside a closed-by-default disclosure.
  Rationale: this preserves the existing availability, conflict, capacity, and info-link behavior for the primary room while reducing visual noise. The disclosure lets a visitor add a second room without changing the booking data model.
  Date/Author: 2026-08-28 / Codex.
- Decision: Use `next-intl` message catalogs for application-owned booking labels and pass a small locale/label object into the shared date/time control.
  Rationale: client components can read route messages with `useTranslations`, while the generic date picker should not guess the active route language. Domain enum values such as `Gratis`, `Betalt`, and `Åpent` remain stable because they are payload values, not display labels.
  Date/Author: 2026-08-28 / Codex.
- Decision: Filter the known Safari DOM mutation in the locale error boundary's PostHog capture and tag it as a browser translation issue rather than suppressing all `NotFoundError` exceptions.
  Rationale: only the specific `removeChild`/`NotFoundError` family is attributable to external DOM rewriting; unrelated errors must still reach the normal error boundary and telemetry. The primary prevention remains matching English document content to `lang="en"`.
  Date/Author: 2026-08-28 / Codex.
- Decision: Keep translation IDs in the shared booking schema and translate them only at the client presentation boundary.
  Rationale: the schema is also used by the server action, where `next-intl` cannot be called; stable IDs avoid coupling the client to Norwegian wording without changing the booking payload or requiring locale-aware server validation.
  Date/Author: 2026-08-28 / Codex.

## Outcomes & Retrospective

Implementation and focused verification are complete. Direct room links keep the requested room as the only primary card and expose other rooms through a closed disclosure. Booking-owned copy, calendar locale, phone-country search labels, validation messages, order summary, terms dialog, and error fallback are localized. The Safari-specific `NotFoundError`/DOM mutation signal is grouped separately in PostHog rather than sent through ordinary exception capture. Sanity-owned editorial sections can still fall back to Norwegian when English content is unavailable; no CMS content was changed. `npm run build:web`, `npm run lint:web`, the focused Vitest suite (39 tests), and local route smoke checks passed. The standalone web typecheck still reports the pre-existing stale `.next/types/validator.ts` reference to the missing `arrangementer/kalender/page.js`, but the production build's TypeScript phase completed successfully.

## Context and Orientation

The web app is under `apps/web`. The room detail route is `apps/web/src/app/[locale]/rom/[slug]/page.tsx`; its booking button links to `apps/web/src/app/[locale]/rom/book/page.tsx`. That server page fetches bookable rooms and passes `initialRoomId` plus the room list into the client form at `apps/web/src/features/booking/components/BookingForm.tsx`.

The client form owns the selected room IDs, refetches rooms when the booker type changes, computes room availability, and delegates the date/time and room picker to `BookingFormScheduleSection.tsx`. That schedule section currently maps every room to a large card. `BookingFormOrderSummary.tsx` independently shows selected rooms and must continue to receive the complete room list so pricing and removal keep working.

Interface text is stored in `apps/web/src/messages/nb.json` and `apps/web/src/messages/en.json`, loaded by `apps/web/src/i18n/request.ts`. Client components use `useTranslations`; server pages use `getTranslations`. Editorial room-page sections come from Sanity and may fall back to Norwegian when English editorial values do not exist.

The locale error boundary is `apps/web/src/app/[locale]/error.tsx`. It is a Client Component because Next.js requires route error boundaries to be client-side components. It currently captures every error directly with PostHog and renders Norwegian fallback copy. The root HTML language is set in `apps/web/src/app/layout.tsx` using `getLocale()`.

The installed Next.js version is 16.3.1. Its local App Router guidance says server pages should fetch data and pass serializable props into interactive Client Components, while `error.tsx` must be a Client Component and may use its retry callback. The implementation will follow those boundaries.

## Plan of Work

First extend both message catalogs with a `RoomBooking` namespace covering the booking page, form sections, room-picker actions, date/time labels, validation display translations, order summary, and fallback error copy. Update the server booking page metadata and visible headings, links, service cards, and section selection to use the resolved locale rather than hardcoded Norwegian. Update the client booking sections and shared booking date/time control to use the catalog. Keep booking state and submitted payload values unchanged; translate only visible strings and validation messages at the presentation boundary.

Next add `initialRoomId` to the schedule-section props. When it identifies a selected room, split the fetched rooms into the selected room and other rooms. Render the selected room in the normal grid/card path, and render the remaining room cards inside the existing `Disclosure` component with a translated summary. When there is no valid initial room, retain the current all-room grid. The disclosure must remain available after a room is added so visitors can add or remove extra rooms, and occupied/conflict cards must continue to behave exactly as they do today.

Then update the error boundary with a narrow predicate for Safari-style external DOM mutation errors. Use it to add stable PostHog grouping metadata and avoid duplicate noisy exception capture for that browser-only signal; keep the fallback UI and normal error handling intact. Remove the unused `open` prop from `TermsDialog` and its call sites. This hardening is defensive; the language parity work is the prevention for the reported trigger.

Finally add focused tests for the room split/presentation helper or schedule behavior and message-key parity where practical. Run the booking-focused tests, web typecheck, lint, `git diff --check`, and the source-specific web build. Use a local dev or production server smoke test for `/nb/rom/teglverket`, `/nb/rom/book?room=...`, and `/en/rom/book?room=...`; verify the query is preserved, the selected room is visually primary, the disclosure expands, and the English route does not emit Norwegian application labels.

## Concrete Steps

Run commands from `/Users/kluvin/dev/kvarteret/samfunnetibergen`.

    git status --short
    rg -n "Book .* her|initialRoomId|NotFoundError|TermsDialog" apps/web/src

Edit the message catalogs and the named route/form files with `apply_patch`. Do not change Sanity schemas or generated Sanity types because this task changes application-owned presentation text and local client state only.

Run focused tests while iterating:

    npm --workspace @samfunnet/web run test -- src/features/booking

Then run the web checks:

    npm run typecheck:web
    npm run lint:web
    git diff --check
    npm run build:web

For an observable smoke test, start the web app from the repository root with:

    npm run dev:web

Open `http://localhost:3187/nb/rom/teglverket`, follow its booking link, select a usable date/time, and inspect the picker. Open `http://localhost:3187/en/rom/book?room=<valid Crescat id>` and verify the root document has `lang="en"` and the application-owned labels are English.

## Validation and Acceptance

The direct-room flow passes when clicking “Book Teglverket her” reaches `/nb/rom/book?room=<id>`, preselects Teglverket, and after date/time selection shows Teglverket in the primary room area without rendering all other rooms there. A visitor can expand the additional-room control, add another available room, see it in the booking summary, and remove it again. The ordinary `/nb/rom/book` flow without `room` continues to show all rooms in the existing grid.

The English route passes when `lang="en"` is present and its application-owned booking headings, labels, actions, room-picker controls, date/time messages, error messages, terms dialog controls, and order summary are English. The route must not rely on a browser translation pass to become readable. Sanity-owned editorial sections may remain Norwegian when the requested English content is absent; this is a documented content fallback, not a code-owned UI mismatch.

The Safari-resilience work passes when the error boundary still renders its retry fallback for ordinary errors, while a matching `NotFoundError`/`removeChild` browser DOM mutation is identified with stable grouping metadata and is not captured as an ordinary fatal application exception. The `TermsDialog` component should have no unused `open` prop, and dialog open/close behavior must remain unchanged.

The focused booking tests, web typecheck, web lint, `git diff --check`, and web build must pass. If a broad check fails from unrelated baseline noise, isolate the touched files and report the unrelated failure rather than calling the feature blocked.

## Idempotence and Recovery

All edits are additive or local replacements and can be repeated safely. Do not run destructive Git commands. If a localization change exposes a missing message key, add the matching key to both catalogs before rerunning typecheck. If the local live-data fetch is unavailable, rely on component tests and the production route smoke test already performed; do not mutate Sanity content as part of this task. If the direct-room layout causes a regression, remove only the new `initialRoomId` filtering/disclosure branch and retain the existing all-room rendering while preserving the localization and error-boundary fixes.

## Artifacts and Notes

The main changed artifacts should be `apps/web/src/messages/nb.json`, `apps/web/src/messages/en.json`, `apps/web/src/app/[locale]/rom/book/page.tsx`, `apps/web/src/features/booking/components/BookingForm.tsx`, `apps/web/src/features/booking/components/BookingFormScheduleSection.tsx`, `apps/web/src/components/ui/date-time-picker.tsx`, the other booking form sections, and `apps/web/src/app/[locale]/error.tsx`. A new small domain/presentation helper test may be added under `apps/web/src/features/booking` if it gives better coverage than a brittle full-form test.

## Interfaces and Dependencies

The implementation will retain these public component/data interfaces unless a small optional prop is needed:

    BookingForm({ initialRooms, initialRoomId, ... })
    BookingFormScheduleSection({ rooms, initialRoomId, roomOccupancy, ... })
    BookingFormOrderSummary({ rooms, selectedRoomIds, ... })

`initialRoomId` is optional. A valid value is a number matching `BookingRoom.crescatRoomId`; invalid or absent values use the existing all-room picker. The room disclosure is the existing `apps/web/src/components/ui/disclosure.tsx`, backed by Base UI's collapsible primitive and rendered closed by default.

The translation dependency is the existing `next-intl` package. The calendar dependency is the existing `react-day-picker` package; route locale selection should map `nb` to its Norwegian locale and `en` to its English locale. No new runtime dependency is expected.

Revision note (2026-08-28): Created after inspecting the linked PostHog report, the live Teglverket booking flow, and the current source. The plan combines the report's English/Safari remediation with the user's direct-room expandable-picker requirement because both affect `/rom/book`.
