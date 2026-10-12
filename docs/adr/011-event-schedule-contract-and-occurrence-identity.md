# ADR 011: Event schedule contract and durable occurrence identity

**Status:** Proposed

**Date:** 2026-10-12

ADR 009 made `GET /api/v1/events` the single events API and the occurrence
`id` Broadcast's stable match key. Many organizers and editors now write
events, and the feed is consumed by Broadcast, the website, and internal
screens. Two parts of the contract do not hold at that scale: what the times
mean, and whether an occurrence keeps its identity when its schedule or
visibility changes. This ADR decides both. Anything stated to an API consumer
must already be enforced by a contract test or the audit; the generated
OpenAPI document, not correspondence, is the source of truth.

## Schedule times

### Context

The timed schedule has `startsAt`, nullable `endsAt`, and nullable
`doorsOpenAt`, and v1 also defines a date-only schedule kind. Sanity stores one
pair of times per date: `startTime` and `endTime`.

Each organizer reads "start" in their own way, and sources rarely say what
their single time means: BIFF lists a showing as "Tivoli 12:30" with a running
time and nothing about doors or program. Our own sources disagree as well:

- The email to Broadcast (2026-09-15) says `startsAt` is doors open, or
  unspecified, and that it might later become performance start.
- A comment in `normalizePublicSchedule` says `startsAt` is program start and
  `doorsOpenAt` is a placeholder.
- The API reference calls `startsAt` a "start timestamp".
- Until 2026-10-06 Studio labelled the fields "Starttid" and "Sluttid", with
  the end optional. Since then they are labelled "Dørene åpner" and "Dørene
  stenger" and are required, and the TicketCo and URL import prompts extract
  door times. This asks organizers to state door times they often do not know.

The feed therefore publishes screening times, organizer start times, and door
times in the same fields, and copies each of them into `doorsOpenAt`.

Broadcast requires a start and an end on every occurrence and rejects
occurrences without them, including date-only ones (2026-09-24). They asked
what `startsAt` means but stated no preference, and apply a 23:00 or
five-hour default for a missing end on their side (2026-10-01). End times were
enforced only in Studio and the submission form, so scripts and older
documents produced `endsAt: null`.

### Decision

The guaranteed times are the advertised times: the start and end the public
is told. Every source can state them truthfully. Door and program times are
more precise facts, published only when someone states them.

| Field | Meaning | Null |
| --- | --- | --- |
| `startsAt` | Advertised start | Never |
| `endsAt` | Advertised or expected end | Never |
| `doorsOpenAt` | Doors open, as stated | When not stated |
| `doorsCloseAt` | Doors close, as stated | When not stated |
| `programStartsAt` | Program or performance start, as stated | When not stated |
| `programEndsAt` | Program or performance end, as stated | When not stated |

`startsAt` and `endsAt` keep their current values. An expected end may be
derived from a stated running time. The 2026-09-15 intention to redefine
`startsAt` as performance start is withdrawn.

`doorsOpenAt` changes from a copy of `startsAt` to a stated door time, null
otherwise. This is a deliberate one-time break of a published field, accepted
because no consumer is live on it and it has never carried information beyond
`startsAt`. Broadcast is told before it ships. `doorsCloseAt`,
`programStartsAt`, and `programEndsAt` are additive.

Every public occurrence has a timed schedule. The date-only schedule kind is
removed from v1.

After this decision, v1 follows these compatibility rules:

- A published field never changes meaning or becomes nullable.
- New fields are additive. Consumers ignore fields they do not recognize.
- Fields that may be unknown are nullable, and null means not stated.
- New schedule kinds, new status values, or removed fields require a new API
  version.

#### Authoring

Each `arrangementDate` in Sanity has a required `startTime` ("Starttid, som
annonsert") and `endTime` ("Sluttid"), and optional `doorsOpenTime`,
`doorsCloseTime`, `programStartTime`, and `programEndTime`. Sanity field names
are internal and may be renamed without an API change.

The submission form and the TicketCo and URL importers fill the optional
fields only from explicit source statements, and their extraction prompts
distinguish advertised, door, and program times. Program times are never
inferred from door times, descriptions, or room bookings, and door times are
never inferred from advertised times.

From 2026-10-06T18:26Z, when the Studio deployment with door labels
completed, until this change ships, every writer recorded door times: Studio
and the submission form under the "Dørene åpner/stenger" labels, and the
TicketCo and URL importers under prompts that extract doors. This changeset
migrates them by provenance, not by date range:

- A one-off migration reads each arrangement's transaction history and selects
  date entries whose `startTime` or `endTime` was last written after the
  cutoff.
- For those entries it sets `doorsOpenTime` and `doorsCloseTime` from the
  written values and leaves `startTime` and `endTime` unchanged, so
  `startsAt` and `endsAt` do not move.
- Entries whose times were last written before the cutoff are not touched.
- The migration runs as a dry run first and lists every entry it would
  change. It writes with `ifRevisionId` so a concurrent edit aborts that
  document rather than overwriting it.

The importer extraction schemas and prompts change in the same changeset to
return `startTime`, `endTime`, `doorsOpenTime`, `doorsCloseTime`,
`programStartTime`, and `programEndTime` separately, each with its evidence.
The advertised start is the earliest time the source presents to the public;
when a source states only doors, the door time is also the advertised start.

#### Time interpretation and validation

All times on a date are Europe/Oslo civil times stored as `HH:MM`. The civil
time is the source of truth, because it is what was advertised. Times are
resolved in sequence from the anchor: doors open when stated, otherwise the
advertised start. The anchor is the first instant on the date whose clock
reads its value. Every later time is the first instant after the anchor at
which the clock reads that value.

This one rule covers every case without asking anyone:

- Doors at 23:00 and a show at 00:11 resolve to 00:11 the following night, a
  71-minute gap.
- In the hour that repeats when summer time ends, a time resolves to whichever
  occurrence the event reaches first. Doors at 22:00 and close at 02:30 resolve
  to the first 02:30, four and a half hours later, which is when the clock
  first shows 02:30 during the event. An anchor inside the repeated hour
  resolves to its first occurrence.
- In the hour that is skipped when summer time starts, the clock never shows
  the time, so it resolves to the instant the clocks jump to plus the same
  offset into the hour: 02:30 becomes 03:30. Studio shows the resolved time
  as a note, not an error.

If the time zone rules change after a time was entered, the civil time is
kept and resolved under the new rules.

Durations, ordering, and plausibility checks use elapsed time between the
resolved instants, not clock differences: 22:00 to 03:00 on the night the
clocks go back is six hours. The API keeps publishing UTC timestamps, which
are unambiguous.

The resolved times must satisfy doors open ≤ program start ≤ program end ≤
doors close, and advertised start ≤ advertised end. Violations are errors.

Plausibility checks are warnings. They are shown in Studio, confirmed in the
submission form, and listed by the audit, and they never block saving:

| Check | Threshold |
| --- | --- |
| Doors open to program start | More than 6 hours |
| Advertised start to end | More than 12 hours |
| Program start before advertised start | Any |

#### Enforcement

The guarantee is kept by prevention where we control the write and by
detection everywhere else:

- Server-side writes (submission form, importers, scripts) pass through one
  validation in `event-document.ts` that rejects a missing advertised start or
  end and any ordering violation.
- Studio document actions that publish, including event status transitions,
  are disabled while the document has validation errors.
- Writes outside our code, through tokens, the Sanity CLI, or old Studio
  deployments, cannot be prevented. The Broadcast readiness audit runs in CI
  and on a schedule, fails on any upcoming public occurrence without an
  advertised start and end, and alerts the editors responsible.
- The API does not filter out occurrences with invalid times. An occurrence
  that drops out of the feed is indistinguishable from a withdrawal, so
  invalid data fails loudly through the audit instead.

#### Website and internal consumers

The website, event-page JSON-LD, infoscreen, and calendar display the
advertised times. JSON-LD maps `startsAt` to `startDate`, `endsAt` to
`endDate`, and a stated door time to `doorTime`. Door and program times are
shown as additional detail when stated.

### Consequences

Broadcast keeps reading `startsAt` and `endsAt` with unchanged values and now
has a written meaning for them. Its missing-end default stops being needed.
The door and program fields can be adopted at any time. Removing nullability
and the date-only kind narrows the response type, which existing consumers
already handle.

Existing data needs no reinterpretation: whatever time an organizer entered is
the time the event was advertised with. Door and program fields start empty,
apart from dates migrated from the door-label period, and fill in as
organizers state them.
Consumers that need a door or performance time fall back to `startsAt`.

Studio relabels the required fields from door times back to advertised times,
reversing the 2026-10-06 labels. The audit becomes an alerting release gate.

## Occurrence identity

### Context

The occurrence ID is `occurrence:{documentId}:{dateKey}`, where `dateKey` is
the `_key` of the entry in the arrangement's `dates` array. Broadcast was told
it survives rescheduling (2026-09-15). It survives only some edits:

- A single or multi-date event gets a random `_key` per date entry. Editing a
  date in place keeps it. Removing a date entry and adding a new one, a common
  way to change a date in Studio, produces a new ID.
- A materialized series instance has a document `_id`, slug, and date `_key`
  derived from the parent, date, and start time
  (`arrangement-{parent}-{date}-{HHMM}`). Regeneration matches existing
  instances by recomputing that ID, and the untouched check reads the
  generated date back out of the `_id`. Changing the series start time or
  recurrence plans a new instance for every date and leaves the existing ones
  as orphans, which editors then delete.

An occurrence also leaves the feed when its arrangement is deleted,
unpublished, moved out of approved status, or marked internal. Consumers see
each of these exactly like a deletion. ADR 009 left open how a consumer
reconciles a missing occurrence.

With many editors and organizers, each of these paths turns an ordinary change
into a lost occurrence, or a lost occurrence and a new one.

### Decision

An occurrence ID is assigned once, when the occurrence is created, and never
derived from its schedule again. Changing a schedule edits the existing
occurrence. Once an occurrence has been public, it leaves the feed only by
passing its date.

#### Dates on any arrangement

- Studio offers rescheduling as an edit of an existing date entry. Removing a
  date entry from a document that has been public requires confirmation and
  is offered as cancelling that occurrence instead.
- The audit reports date entries whose `_key` disappeared from a previously
  public document, so identity loss through other write paths is detected.

#### Materialized series instances

- New instances get an opaque `_id` and date `_key`. Existing instances keep
  their current IDs; their date-shaped form is not interpreted.
- Each instance records the occurrence it was generated for in a
  `generatedOccurrence` field (date and times). The untouched check compares
  against this field, not against the `_id`.
- Regeneration reconciles planned occurrences against existing instances of
  the same parent. An instance whose `generatedOccurrence` matches a planned
  occurrence is kept. When only the series time changes, untouched instances
  on the same date are updated in place. When the recurrence changes, the
  editor sees unmatched instances paired in date order with unmatched planned
  occurrences and confirms each move, which patches the existing instance.
  Only planned occurrences left unpaired create new instances.
- An instance that no longer belongs to the series is cancelled, not deleted.
- The slug is set at creation and is not regenerated when the schedule
  changes, so website links stay stable.

#### Withdrawal and visibility

- Cancellation is the supported way to withdraw a public event. Cancelled
  occurrences remain in the feed with `status: "cancelled"`.
- Deleting and unpublishing arrangements is limited to administrators and to
  documents that have never been public, for duplicates, tests, and mistakes.
- An arrangement that has been public cannot be moved out of approved status
  or marked internal. Studio offers cancellation instead.
- A postponement without a new date is a cancellation. When the new date is
  known, the occurrence is rescheduled if it has not yet been cancelled, or a
  new occurrence is created if it has.

#### Missing occurrences

The snapshot contains every public occurrence from `from` onward. A consumer
that no longer sees an occurrence whose start is still inside the requested
range treats it as withdrawn in error rather than cancelled, and keeps its
last known state. The audit reports any such disappearance, and editors
restore or cancel the occurrence.

### Consequences

Broadcast can rely on one occurrence ID per real occurrence across time
changes, date moves, recurrence edits, visibility changes, and cancellation,
which makes the 2026-09-15 statement true. Instances created before this
decision keep date-shaped IDs and slugs, which remain valid opaque identifiers
even when they no longer match the date.

Editors confirm moves when a recurrence changes and confirm date removals on
public documents. Pairing in date order can be wrong around skipped weeks, so
each pair is shown for confirmation rather than applied silently.

The audit needs the previous snapshot to detect disappearances. It keeps the
set of public occurrence IDs and their date keys between runs.

## Open items

- Audit alerts need named recipients: the organizer contact, the approving
  editor, or the IT lead.
- Broadcast was told events are kept six months after their last occurrence.
  Retention of past occurrences in the feed is not yet decided.

## Verification

    npm --workspace @samfunnet/web run events:audit:broadcast

Contract tests assert that every timed schedule has non-null `startsAt` and
`endsAt`, that the optional fields are null unless their source field is set,
that the 23:00/00:11 case resolves to the following day, that a time in the
repeated October hour resolves to the first occurrence after the anchor, that
a time in the skipped March hour resolves an hour later, that durations across
both transitions use elapsed time, and that
ordering violations are rejected while the plausibility thresholds only warn.
Migration tests assert that only entries last written after the cutoff gain
door times and that `startsAt` and `endsAt` are unchanged for every entry.

Instance tests assert that changing a series time or recurrence and
regenerating keeps every existing occurrence ID, and that no generation path
deletes an instance. Studio tests assert that rescheduling a date keeps its
`_key` and that a public arrangement cannot be unapproved, marked internal,
deleted, or unpublished. The audit test asserts that a removed `_key` or a
disappeared occurrence is reported.

Run focused event tests, web typecheck, and the web build.
