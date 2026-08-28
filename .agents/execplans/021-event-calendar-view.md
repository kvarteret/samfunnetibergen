# Add an event calendar view

This ExecPlan is a living document. It follows `.agents/PLANS.md` and must be
kept current as the feature is implemented.

## Purpose / Big Picture

People visiting the site will be able to browse upcoming arrangements in a
month-by-month calendar: each month can be opened, each day shows its events,
and an event links to the existing arrangement detail page. The calendar will
use the same Sanity-backed `fetchPublishedEvents` source that currently powers
`/[locale]/arrangementer`; no new API or second event query is introduced.

The existing arrangement-card page will remain available and will show one
card for the first concrete day of each series or festival, so a recurring
title is not repeated once per generated child document. This filtering happens
after the shared fetch in the page layer. The calendar intentionally keeps all
concrete child instances so recurring series and festival days appear on their
actual dates.

The result is observable at `/nb/arrangementer` and `/nb/arrangementer/kalender`
(and the equivalent `/en` paths) after starting the web app. The home page's
existing “Vis kalender” link will lead to the calendar view.

## Progress

- [x] (2026-08-27) Read repository guidance, event/Sanity ownership, and the
  installed Next.js App Router guidance.
- [x] (2026-08-27) Confirmed the shared source is
  `apps/web/src/lib/sanity/fetch/events.ts` and that Sanity already returns
  materialized series/festival instances as concrete public rows.
- [x] (2026-08-27) Add and test a pure local filter that keeps the first child per
  series or festival on the card-list page.
- [x] (2026-08-27) Add and test pure calendar grouping helpers that flatten event
  dates into current-week-and-later month/day buckets.
- [x] (2026-08-27) Build the localized calendar route and interactive month/day
  presentation.
- [x] (2026-08-27) Add list/calendar navigation and translations.
- [x] (2026-08-27) Run focused tests, type checking, lint/format checks, and the
  web build for the touched routes.
- [x] (2026-08-28) Merge the calendar-view branch into the current `develop`
  baseline and stack calendar day cells into one column on mobile while keeping
  the seven-column layout from `md` upward.

## Surprises & Discoveries

- Observation: `publishedEventsQuery` returns only concrete events, while
  series and festival parents are excluded from ordinary public listings.
  Evidence: `apps/web/src/lib/sanity/queries/events.ts` defines
  `CONCRETE_EVENT_KINDS` as `single`, `seriesInstance`, and `festivalSession`.
- Observation: child rows are ordered by their first future date, which makes a
  stable first-instance filter possible without changing the Sanity query.
  Evidence: `publishedEventsQuery` orders by
  `dates[startDate >= $today][0].startDate`.
- Observation: `eventProjection` includes all dates on an event row, so the
  calendar must locally discard dates before the server-provided Oslo “today”
  boundary even though the query excludes rows with no future dates.
  Evidence: the query filters rows with `count(dates[startDate >= $today]) > 0`
  but projects `dates[]` without the same date predicate.
- Observation: the requested visibility boundary is the Monday of the current
  Oslo week, not the current day. This keeps the current week's earlier dates
  visible while removing older history.
  Evidence: `buildCalendarMonths` normalizes the server-provided Oslo date to
  the week's Monday before grouping dates.
- Observation: the visual direction works better with light day cells, subtle
  borders, restrained gaps, and no filled dark grid frame; event cards can use
  the full width of their day cell.
  Evidence: the calendar component uses transparent grid spacing and light
  surfaces while retaining primary-colored date headers for orientation.
- Observation: alternating a very light grey surface on every other day makes
  the seven-column layout easier to scan without restoring the visual noise of
  strong grid backgrounds.
  Evidence: adjacent rendered day cells alternate between theme-aware
  `bg-background` and the opaque `var(--cream-100)` surface.
- Observation: the calendar grid must remain transparent so the active theme's
  page surface is visible between day articles; only the articles carry the
  alternating white/grey treatment.
  Evidence: the grid uses `bg-transparent`, while day articles use
  theme-aware `bg-background` or opaque `var(--cream-100)`.
- Observation: the original seven-column grid used a fixed minimum width at all
  breakpoints, which made the mobile calendar horizontally scroll instead of
  reading as a stacked list.
  Evidence: `EventCalendar.tsx` now uses `min-w-0 grid-cols-1` by default and
  applies `md:min-w-[60rem] md:grid-cols-7` only from the medium breakpoint.

## Decision Log

- Decision: Put the calendar at `/[locale]/arrangementer/kalender` and keep
  `/[locale]/arrangementer` as the card-list route.
  Rationale: the request separates the new calendar presentation from the
  existing page's local deduplication requirement, and the current home page
  already exposes a calendar-labelled link. A nested route makes both views
  discoverable without changing detail URLs or adding a new top-level concept.
  Date/Author: 2026-08-27 / Codex.
- Decision: Reuse `fetchPublishedEvents` directly from the new route and do not
  create an API or refactor the fetch boundary yet.
  Rationale: this preserves the requested future API constraint while keeping
  the current change small and ensuring both views render the same resolved
  Sanity data.
  Date/Author: 2026-08-27 / Codex.
- Decision: Apply first-instance deduplication only to the existing list page,
  keyed by `parentEvent._id` for `seriesInstance` and `festivalSession` rows.
  Rationale: generated children represent real dates and must all remain in the
  calendar; the list page is the place where repeated inherited titles create
  duplicate-looking cards.
  Date/Author: 2026-08-27 / Codex.
- Decision: Render every available month expanded initially, while allowing
  each month summary to be opened or closed independently. Use one stacked day
  column on narrow screens and restore the Monday-first seven-column grid from
  the medium breakpoint upward.
  Rationale: this gives an immediately useful overview without requiring
  repeated opening actions, matches the supplied mobile calendar reference,
  avoids horizontal scrolling on phones, and preserves the weekday-column
  relationship on larger screens. The interaction remains keyboard accessible
  through native buttons and labelled sections.
  Date/Author: 2026-08-28 / Codex.
- Decision: Start the calendar on the Monday of the current Oslo week and do
  not render earlier day cells.
  Rationale: the request excludes past dates beyond the current week while
  still allowing the current week to be browsed from its beginning.
  Date/Author: 2026-08-27 / Codex.
- Decision: Shade alternating day cells with a light grey surface.
  Rationale: this improves scanability while preserving the requested light,
  spacious visual treatment.
  Date/Author: 2026-08-27 / Codex.

## Outcomes & Retrospective

Implemented and verified. Visitors can switch between the existing card list
and the localized calendar, filter both views through the existing event
context, browse concrete recurring/festival instances on their actual dates,
and close months independently after all available months open by default.
The calendar begins on the current week's Monday, uses light spacious cells,
renders cards full width inside each day, stacks days into one column on mobile,
and uses seven weekday columns on larger screens. The later event-source/API
extraction remains deliberately out of scope; both presentations still call
`fetchPublishedEvents(locale)` directly.

## Context and Orientation

This is a Next.js App Router monorepo. The web app is under `apps/web` and uses
`next-intl` locale routing, with all public pages nested under
`apps/web/src/app/[locale]`.

The public event source is `apps/web/src/lib/sanity/fetch/events.ts`.
`fetchPublishedEvents(locale)` calls `publishedEventsQuery` from
`apps/web/src/lib/sanity/queries/events.ts`; the fetch helper resolves inherited
series/festival content, applies display defaults, and returns frontend-ready
rows. A `PublishedEvent` may be a single event, a generated series instance,
or a generated festival session. Its `dates` array contains date entries with
`startDate`, optional `startTime`, and optional `endTime`.

The current list route is
`apps/web/src/app/[locale]/arrangementer/page.tsx`. It fetches the shared rows,
precomputes date labels, and passes them into
`apps/web/src/features/events/components/EventsPage.tsx`. The client-side
filter context in `apps/web/src/features/events/context/EventsContext.tsx`
filters the rows by event taxonomy. The card list is rendered by
`EventsPageSections.tsx` and `EventCard.tsx`.

The new calendar presentation belongs alongside those components under
`apps/web/src/features/events/components`. The route page remains a Server
Component so it can fetch Sanity data and localized strings, then passes
serializable event rows into a small Client Component for month expansion and
filter-aware rendering. This follows the installed Next.js rule: use Server
Components for data fetching and Client Components only where state and event
handlers are needed.

The attached images are visual references only. They are not repository
instructions and do not override the written request or repository guidance.

## Plan of Work

First add a pure helper in `apps/web/src/features/events/domain/eventUtils.ts`
that preserves input order and returns all single events plus only the first
row for each parent-backed series or festival. Add a focused test file beside
it covering two children from one parent, children from different parents, and
single events. The page will call this helper after `fetchPublishedEvents`
returns, before building its precomputed-date map.

Next add `apps/web/src/features/events/domain/calendar.ts`. Define a calendar
month type containing a `YYYY-MM` key, year/month metadata, Monday-based leading
empty cells, and day buckets. Define an occurrence type that pairs a
`PublishedEvent` with one date entry. Export a pure grouping function that
starts at the Monday of the server-provided Oslo current week, ignores dates
before that boundary, keeps empty months between the first and last visible
occurrence, and sorts occurrences by start time within each day. Add tests for
current-week visibility, multi-date events, empty months, Monday-based offsets,
and chronological ordering.

Then create `apps/web/src/features/events/components/EventCalendar.tsx` as a
Client Component. It will read `filteredEvents` from `EventsContext`, build
calendar months using the supplied `today` string, render a month summary row
with its occurrence count, and expand every available month by default. Each
open month will render a one-column mobile grid that becomes a seven-column
Monday-first grid from the medium breakpoint, with a strong primary day header,
event image/title/time links, cancellation markers, and an empty-day state that
does not create noisy placeholder text. Use existing image URL and link
utilities and the project's focus, border, and shadow tokens.

Create `apps/web/src/features/events/components/EventCalendarPage.tsx` as the
server-side composition wrapper. It will place `EventsProvider` around the
existing `EventsPageFilters` and `EventCalendar`, provide the same search
parameter filtering behavior as the list, and add links between the calendar
and card-list views. Add the route at
`apps/web/src/app/[locale]/arrangementer/kalender/page.tsx`, calling
`fetchPublishedEvents(locale)` directly, passing `getOsloDateString()` as the
date boundary, and using the existing locale/static-param/metadata patterns.

Finally add the necessary `EventsPage`, `Metadata`, and calendar/list labels to
`apps/web/src/messages/nb.json` and `apps/web/src/messages/en.json`. Update the
home page's calendar-labelled link to point to the new nested route and expose a
calendar link on the existing arrangement list. Do not modify Sanity schemas,
queries, generated types, or feed/API routes because the requested source/API
refactor is explicitly deferred.

## Concrete Steps

Run all commands from `/Users/kluvin/dev/kvarteret/samfunnetibergen`.

Inspect the current working tree before editing:

    git status --short

After adding the pure helpers, run the focused web tests:

    npm run test:web

After the route and UI are implemented, run:

    npm run typecheck:web
    npm run lint:web
    npx --no-install biome format --check apps/web/src/features/events apps/web/src/app/'[locale]'/arrangementer apps/web/src/messages/nb.json apps/web/src/messages/en.json
    npm run build:web

If the build requires environment values that are absent locally, report that
fact and retain the successful focused checks; do not change deployment
configuration to make the local build pass.

## Validation and Acceptance

The pure filtering test must demonstrate that a list input containing two
series instances with the same `parentEvent._id`, two festival sessions with a
different parent, and ordinary singles returns one row for each parent and all
ordinary singles in their original order.

The calendar grouping tests must prove that an event with one pre-current-week
and one current-week date contributes only the visible date, an event with
multiple visible dates appears on each corresponding day, a gap month is
present with count zero, and the first day of a month produces the correct
Monday-first leading cell count.

With the web app running via `npm run dev:web`, opening
`http://localhost:3187/nb/arrangementer` must show no repeated card for later
children of the same series or festival; the first child remains linked to its
existing detail page. Opening
`http://localhost:3187/nb/arrangementer/kalender` must show the same event data
in month summaries, open all available months initially, allow a user to close
one month without closing the others, and place every visible concrete child
on its own date. Applying the existing filters must update the calendar's
month counts and event cells without another data request.

The equivalent `/en` routes must use English UI labels while preserving
localized Sanity event content. Empty future data must produce the existing
empty-state message rather than a broken calendar, and cancelled events must
remain visibly marked.

## Idempotence and Recovery

All changes are additive and safe to re-run. The filter and grouping helpers
are pure, so their tests can run repeatedly without changing content. If a
visual adjustment is needed, edit only the calendar component and rerun the
focused checks. If the route introduces a type-generation issue, run
`npm run route-typegen` and review the generated route types; do not regenerate
Sanity types because no query or schema changed.

The implementation does not delete or migrate Sanity documents. Reverting the
new route/component files and the small list/home/translation edits restores
the previous behavior without affecting Sanity or feeds.

## Artifacts and Notes

The final implementation should leave the shared data boundary unchanged:

    fetchPublishedEvents(locale)
      -> local first-instance filter for `/arrangementer`
      -> card list

    fetchPublishedEvents(locale)
      -> future-date grouping for `/arrangementer/kalender`
      -> month/day calendar

This split is intentional preparation for a later extraction of the event
source into a reusable listing/API module.

## Interfaces and Dependencies

Use the existing dependencies and conventions. No package installation is
needed.

The filtering helper should have a stable shape such as:

    export function filterToFirstInstances(events: PublishedEvent[]): PublishedEvent[]

The calendar grouping module should export serializable types and a pure
function with a stable shape such as:

    export type CalendarOccurrence = {
      event: PublishedEvent
      date: EventDateEntry
    }

    export type CalendarMonth = {
      key: string
      year: number
      month: number
      leadingEmptyDays: number
      days: Array<{ date: string; occurrences: CalendarOccurrence[] }>
      eventCount: number
    }

    export function buildCalendarMonths(
      events: PublishedEvent[],
      today: string,
    ): CalendarMonth[]

Use `next/image`, `@/i18n/navigation`, `sanityImageUrl`, and
`shouldLoadImageDirectly` for event cards, and use `useEvents()` for the
already-loaded filtered rows. Keep Sanity access in the server fetch boundary;
the Client Component must receive resolved event props and must not import a
Sanity client or create a second query.

## Plan Revision Note

2026-08-27: Created after source inspection. The route, local deduplication
boundary, and calendar's all-instance behavior were made explicit so the later
API extraction can reuse the same fetch source without being coupled to either
presentation.

2026-08-27: Revised during implementation to start visibility at the current
Oslo week's Monday, expand all available months by default, toggle months
independently, use lighter spacing/surfaces, and let event cards fill their day
cell width in response to the visual review.

2026-08-27: Added an opaque alternating day-cell shade after visual review to
improve scanability without introducing heavy backgrounds.

2026-08-27: Kept the alternating backgrounds on the day articles only and made
the calendar grid transparent so both themes show their page surface between
articles.

2026-08-28: Merged `codex/event-calendar-view` into the current `develop`
baseline and changed the day grid to one column on mobile, restoring seven
columns at `md` and above so the calendar follows the supplied mobile reference
without horizontal scrolling.
