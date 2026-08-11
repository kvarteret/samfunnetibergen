# ADR 005: Materialized event instances and festival event graphs

**Status:** Proposed  
**Date:** 2026-07-07

## Context

Samfunnet i Bergen currently stores public arrangements in Sanity as
`arrangement` documents. The website reads those documents through
`src/lib/sanity/queries/events.ts` and `src/lib/sanity/fetch/events.ts`, then
renders them on the homepage, arrangement listing, arrangement detail pages, and
JSON-LD event feed.

Recurring events are currently represented by fields on the arrangement itself:
`isRecurring`, `rrule`, and one or more stored `dates`. Some public surfaces
unfurl the recurrence rule at render time to show future dates. This makes the
recurrence rule the source of the future instances, but the generated instances
are not durable content records. Individual occurrences cannot be cancelled,
edited, linked, approved, or described independently without adding exception
logic around the parent event.

The same modeling problem appears for festivals. A festival can have a promoted
parent event, while many concrete sessions happen across multiple rooms and
multiple days. These sessions need to remain independently listable and
editable, but they also need a durable relationship to the festival parent. The
festival parent must be promotable on its own without every child session being
promoted individually.

The JSON-LD feed currently ships a non-standard `rrule` extension on recurring
entries (`src/app/api/events/feed/route.ts`), pushing recurrence expansion onto
every consumer, including the app.

## Decision

Keep `arrangement` as the shared document type and model events as a graph of
related arrangements.

### New fields

Add relationship and status fields to `arrangement`:

- `eventKind`: `single`, `seriesParent`, `seriesInstance`, `festivalParent`,
  or `festivalSession`. Read contracts treat a missing value as `single` (see
  Query contract below), and the migration backfills it.
- `parentEvent`: a **strong** reference to another `arrangement`, required for
  `seriesInstance` and `festivalSession`, disallowed for the other kinds. The
  strong reference means Sanity blocks deleting a parent while children exist,
  which is the behavior we want: removing a series or festival is an explicit
  act of first deleting or detaching its children.
- `eventStatus`: `scheduled` or `cancelled`. Both values are required and
  supported end to end (schema, queries, UI states, feed). The field defaults
  to `scheduled` and is changed through constrained Studio actions rather than
  direct field editing.

Keep `approvalStatus` as the editorial publication workflow state. Use
`eventStatus` for the real-world state of the event. The two are orthogonal: a
cancelled event can still be approved and publicly visible with a cancelled
state.

### Derived editorial lifecycle (2026-08-11)

The Arrangementer browser presents exactly four mutually exclusive statuses
for approved top-level events. These are view-time classifications, not four
stored values:

- `Godkjent`: scheduled and its latest approved own/child start date is today
  or later, or no date exists;
- `Kansellert`: cancelled and its latest date is today or later, or no date
  exists;
- `Gjennomført`: scheduled and its latest date is earlier than today but still
  inside the current calendar half-year;
- `Arkivert`: scheduled with its latest date before the current half-year, or
  any cancelled event whose latest date is in the past.

The current half-year begins on January 1 or July 1, evaluated using the
Europe/Oslo date. For a multi-date single, series parent, or festival parent,
the latest approved own or child date is authoritative. Editors do not write
completed or archived state. After request approval, the only real-world
transition is `scheduled` to `cancelled`, and a cancelled event may only return
to `scheduled` (presented as Godkjent, Gjennomført, or Arkivert according to
its date).

### Graph shape constraints

The event graph is **exactly one level deep**:

- Only `seriesParent` and `festivalParent` may be referenced by `parentEvent`.
- `seriesInstance`, `festivalSession`, and `single` documents must never be the
  target of another document's `parentEvent`.
- Schema validation enforces this: `parentEvent` validation resolves the
  referenced document and rejects the reference when the target's `eventKind`
  is not the matching parent kind (`seriesInstance` → `seriesParent`,
  `festivalSession` → `festivalParent`).

A recurring event inside a festival is modeled as multiple `festivalSession`
documents generated from a rule, not as a nested series.

### Conditional validation by kind

Change schema validation so required fields depend on `eventKind`:

- `single` requires title, slug, and at least one date;
- `seriesParent` and `festivalParent` require title and slug; dates are
  optional overview dates;
- `seriesInstance` and `festivalSession` require `parentEvent`, slug, and
  **exactly one** date entry. A concrete instance is one occurrence; an event
  spanning several days within a festival is modeled as one session per day or
  as one session whose single date entry carries start and end times. Title
  and other display fields may be omitted and inherited from the parent.

`isRecurring` and `rrule` are only meaningful on `seriesParent` (and remain
readable on legacy documents during migration). The recurrence builder in the
public submission form keeps writing them; they become authoring/generation
metadata rather than a public read contract.

### Inheritance

Child arrangements use fallback inheritance, resolved at read time in a domain
layer (not denormalized into the child document):

- **Inherited when missing on the child:** title, description, image and image
  caption, organizer (group and free text), event type, pricing fields
  (`isFree`, all price fields), ticket and Facebook links, `isInternalEvent`,
  and SEO/sharing defaults.
- **Never inherited:** `isPromoted`, `eventStatus`, `approvalStatus`, slug,
  `dates`, `parentEvent`, `eventKind`, room/location fields, and submission
  metadata (`submittedBy*`, `adminNote`). Promotion of a festival parent must
  not promote its sessions — this is a core motivation for this ADR. Location
  is per-occurrence by nature (festival sessions run in different rooms), so a
  child without a room simply has no room rather than inheriting the parent's.

Child values always override parent values. Inheritance is shallow field-level
fallback (`child.field ?? parent.field`), never a merge within a field.

### Identity and idempotent generation

Generated children use a **deterministic root-path document `_id`** derived
from the parent and the occurrence:

```
arrangement-<parentDocumentId>-<yyyy-mm-dd>[-<hhmm>]
```

The `-<hhmm>` start-time suffix is always included when the occurrence has a
start time, which disambiguates two occurrences on the same date (matinee and
evening show). The deterministic `_id` is the idempotency key: generation runs
use `createIfNotExists`, so rerunning a generation never overwrites an existing
child — including children an editor has since edited, cancelled, or approved.
No separate source-key field is needed.

Do not use periods in generated public child IDs. Sanity treats IDs under a
sub-path as private to unauthenticated clients, and the public site reads
arrangements without an authentication token.

Child slugs are generated the same way: `<parent-slug>-<yyyy-mm-dd>` with a
`-<hhmm>` suffix when a start time exists. Slug uniqueness validation applies
as for any arrangement.

### Generation workflow and lifecycle

Bulk generation is an editor/admin workflow:

- a recurrence rule on a `seriesParent` expands from the seed date into child
  `seriesInstance` documents for one editor-selected program semester at a
  time. `VYY` covers January 3 through May 29 and `HYY` covers August 17
  through December 15. The seed anchors the pattern, the rule stores cadence,
  and the selected semester is the sole materialization boundary. Legacy
  `COUNT` and `UNTIL` options are ignored during generation;
- Studio places semester generation beside the recurrence controls in the
  arrangement's primary date view. It first asks the editor to choose a
  semester such as `V26` or `H26`, then uses a preview-and-confirm flow:
  the editor sees which occurrences will be created, which already exist, and
  which existing children no longer match the rule, before anything is
  written;
- generated children of an **approved** parent are created with
  `approvalStatus: "approved"`; generated children of a pending parent are
  created as `pending`. This avoids forcing editors to individually approve
  ~26 instances of an already-reviewed weekly series, while keeping publicly
  submitted series gated until an editor approves the parent and generates.

**Rule changes after generation** are handled explicitly, not silently:

- when the rule on a `seriesParent` changes, the next generation run computes
  the new occurrence set and diffs it against existing children;
- occurrences in the new set that lack a child are created as usual;
- existing children whose occurrence is no longer in the rule are flagged in
  the confirm step. Untouched generated children (never edited by a human,
  still `scheduled`, no child-specific field overrides) may be deleted by the
  editor from that flow. Children that have been edited, cancelled, or
  individually approved are **never auto-deleted**; the flow lists them and
  the editor decides per document (keep as a one-off, cancel, or delete);
- "untouched" is determined by comparing the child against the exact shape
  generation would produce (only generated fields set, `eventStatus:
  scheduled`), not by revision heuristics.

**Semester extension:** materialized series run dry when their last selected
semester passes. The Studio desk structure includes a "series needing
regeneration" queue listing `seriesParent` documents whose last generated child
date is less than a configurable lead time (default eight weeks) away. An
editor extends a series from the semester control beside its recurrence pattern
and chooses the next semester. Each preview compares only children inside that
semester, so valid days in other semesters are never presented as obsolete.

### Parent status semantics

Parent `eventStatus` does **not** cascade by writing to children. Instead:

- setting a parent to `cancelled` is an explicit Studio action and does not
  rewrite children;
- read contracts expose the parent status alongside each child (the child
  projection includes `parentEvent->eventStatus`) so consumers can render a
  "part of cancelled festival" state even when an individual session was not
  bulk-updated. The effective public status of a child is
  `child.eventStatus != "scheduled" ? child.eventStatus :
  (parent.eventStatus != "scheduled" ? parent.eventStatus : "scheduled")`,
  computed in the shared domain layer so website and app agree.

### Festivals

The festival parent represents the festival overview. Festival sessions are
child arrangements connected through `parentEvent`. Parent dates are
independent overview dates stored on the parent. They may be empty, or they may
span the full festival duration. Child date changes do not automatically
rewrite parent dates. Festival sessions are authored manually or in bulk (a
festival is rarely rule-shaped); the recurrence generator is not required for
`festivalSession` creation but the deterministic `_id`/slug scheme applies when
tooling creates them.

### Query contract for legacy documents

Every read that filters on `eventKind` must treat a missing value as `single`:

```groq
coalesce(eventKind, "single") in ["single", "seriesInstance", "festivalSession"]
```

This is a hard contract, verified by tests. The migration backfills
`eventKind` on future-facing documents, but past events may remain
legacy-shaped indefinitely, and drafts, imports, or race conditions can always
produce documents without the field. No query may silently drop them.

## Public Behavior

Normal event listings and feeds show concrete events: `single` events,
`seriesInstance` children, and `festivalSession` children (with the
`coalesce` contract above).

Recurring series parents do not appear in normal listings and do not duplicate
their children. Their detail page acts as a series overview and lists generated
child instances. Parent overview dates render on parent detail or promoted
surfaces when present.

Festival sessions appear independently in normal listings. A promoted festival
parent may also appear in promoted surfaces; because `isPromoted` is never
inherited, promoting the parent does not promote sessions. The parent detail
page acts as the festival overview and lists all child sessions with links.

Every child event has its own canonical URL and detail page.

Cancelled events remain queryable. Public surfaces show them with a Kansellert
badge or detail state instead of silently removing them. Approved cancelled
child detail pages bypass the normal
upcoming-date filter so previously shared canonical URLs do not turn into 404s
only because the real-world status changed. Listings may filter or de-rank
cancelled events, but detail routes must stay resolvable.

The JSON-LD event feed emits concrete event entries only. It drops the
non-standard `rrule` extension currently emitted in
`src/app/api/events/feed/route.ts`; consumers no longer expand recurrence.
Feed status uses the effective status (child + parent resolution above) mapped
to Schema.org:

- `scheduled` → `https://schema.org/EventScheduled`;
- `cancelled` → `https://schema.org/EventCancelled`;

Because each occurrence is its own document with its own URL, the current
`#<date._key>` fragment-id disambiguation in the feed becomes unnecessary for
generated instances and is kept only for multi-date `single` events.

## Migration

**Superseded (2026-07-07): no data migration.** The site is unreleased and
existing events are expired or irrelevant; this is greenfield. No backfill or
conversion scripts are written. The rollout reduces to:

1. Switch public queries to the materialized model (with the `coalesce`
   legacy contract, kept as cheap safety for drafts and future imports that
   lack `eventKind`).
2. Remove read-time RRULE expansion from public surfaces; keep RRULE parsing
   for editor preview and generation.

Execution detail lives in
`.agents/execplans/008-materialized-event-instances.md`.

Public recurring submissions remain possible. They enter the editorial workflow
as pending `seriesParent` documents; an editor approves the parent and runs
generation before the series appears in public listings (as children).

## Implementation Notes

Update the Sanity schema under `src/studio/schemaTypes/documents/arrangement.ts`
with the new fields, kind-conditional validation, and the graph-shape
constraint on `parentEvent`, then regenerate TypeGen.

Update the Studio preview and orderings: the current preview selects `title`
directly, so children with inherited titles would render as the generic
fallback in desk lists. The preview must select `parentEvent->title` as a
fallback and show the event kind and `eventStatus` in the subtitle.

Update Studio desk structure with editorial queues: series parents, festival
parents, children per parent, pending generated children, cancelled events,
and the "series needing regeneration" queue.

Update frontend queries under `src/lib/sanity/queries/events.ts`:

- concrete event listings and feeds fetch `single`, `seriesInstance`, and
  `festivalSession` (with the `coalesce` legacy contract) and project
  `parentEvent->` fields needed for inheritance and effective status;
- parent overview pages fetch one parent plus its children via
  `*[parentEvent._ref == ^._id]`;
- promoted surfaces fetch promoted parents separately from promoted concrete
  events.

Add an event-resolution domain layer under `src/features/events/domain/`
(e.g. `resolveEvent.ts`) that merges child fields with inherited parent fields
and computes effective status before cards, detail pages, homepage promoted
events, and feeds render. Website and app consume the same resolution rules;
the resolution logic is pure and unit-tested.

Implement generation under `src/features/events/domain/` reusing the existing
`rrule` dependency (`src/features/events/domain/recurrence.ts`). All occurrence
math is done in Europe/Oslo (`TZDate` from `@date-fns/tz`, already used by the
feed) so DST transitions do not shift weekly occurrences by an hour or a day.

## Consequences

Editors can cancel and edit one occurrence without adding special exception
rules to the parent event.

Website, app, feeds, and SEO consumers read concrete event instances instead of
having to understand recurrence expansion. The shared domain layer is the
single place where inheritance and effective status are defined.

The content model has more documents (a weekly series over a semester is ~26
documents), but each public occurrence becomes a durable content record with
normal Sanity workflows. Studio queues keep this manageable.

Parent edits can affect child rendering through fallback inheritance. If a
child needs different content, editors explicitly override the relevant child
field. This is intentional: fixing a typo on the parent fixes all
non-overridden children.

Rule changes after generation require an explicit reconciliation step. This is
more editor work than silent regeneration, but it guarantees that individually
edited or cancelled occurrences are never destroyed by a rule tweak.

Strong parent references make parent deletion deliberate: children must be
removed or detached first.

Editors must select and generate each new semester; this depends on the Studio
regeneration queue being checked.

## Test Plan

Unit test recurrence generation:

- weekly, biweekly, and monthly rules;
- Europe/Oslo timezone safety across both DST transitions;
- the `VYY` and `HYY` program boundaries, including expansion of a rule into a
  later semester while preserving its original seed alignment;
- legacy `COUNT` and `UNTIL` options being ignored so they cannot invisibly
  shorten the selected semester;
- deterministic `_id` and slug derivation, including two occurrences on the
  same date with different start times;
- idempotency: rerunning generation creates nothing new and modifies nothing;
- rule-change diff: added occurrences created, removed occurrences flagged,
  edited/cancelled children never listed as deletable.

Unit test inheritance and status resolution:

- child override wins over parent fallback for every inherited field;
- missing child display fields fall back to the parent;
- `isPromoted`, `eventStatus`, `approvalStatus`, slug, dates, and location
  never inherit;
- effective status: child `cancelled` wins; parent `cancelled` applies to a
  `scheduled` child; both `scheduled` yields `scheduled`.

Unit test schema and migration rules:

- future non-recurring events backfill to `single` with `eventStatus:
  scheduled`;
- future recurring parents generate children without duplicating existing
  deterministic `_id`s;
- migration rerun is a no-op;
- child titles may be omitted when a parent is present;
- child slugs and single-date requirement enforced for concrete children;
- `parentEvent` rejected when the target is not the matching parent kind.

Verify query/fetch contracts:

- documents without `eventKind` resolve as `single` in every public query;
- child projections include parent fields needed for inheritance and
  effective status;
- parent pages fetch their children.

Verify public routes and feeds:

- `/arrangementer` lists children without duplicate recurring parents and
  without dropping legacy documents;
- child detail pages render inherited parent data plus child-specific
  date/location/status;
- festival parent pages list child sessions;
- promoted parent renders without promoting or duplicating children;
- approved cancelled child detail pages remain accessible by
  slug;
- the JSON-LD feed emits concrete scheduled and cancelled entries
  with Schema.org status URLs and no `rrule` extension.

Run `npm run sanity:typegen` after schema/query changes and `npm run build`
after route/feed changes.

## Assumptions

This ADR defines the shared Sanity content contract consumed by both the
website and app. App-specific UI and synchronization work can be planned
separately, but the effective-status and inheritance rules defined here are
normative for both consumers.

Bulk recurrence generation is an editor/admin workflow first, not a public
self-service publishing feature.

Existing single events continue to behave as single arrangements, resolving to
`eventKind: single` via the query contract until backfilled.

Semester generation is an explicit editor action. Automatic semester creation
is not part of the implementation.
