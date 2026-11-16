# ADR 011: Event schedule contract and durable occurrence identity

**Status:** Proposed

**Date:** 2026-10-12

## Context

`startsAt` means doors, program start, or a screening time depending on who
entered it, and our email, code, API reference, and Studio labels disagree.
End times were enforced only in Studio and the form, so the feed published
`endsAt: null`, which Broadcast rejects. Occurrence IDs change when a date
entry is replaced or a series is regenerated, and occurrences vanish when an
event is unapproved, made internal, deleted, or unpublished. Broadcast sees
each as a deletion.

## Decision

### Schedule times

| Field | Meaning | Null |
| --- | --- | --- |
| `startsAt` | Advertised start | Never |
| `endsAt` | Advertised or expected end | Never |
| `doorsOpenAt`, `doorsCloseAt` | Door times, as stated | When not stated |
| `programStartsAt`, `programEndsAt` | Program times, as stated | When not stated |

- `startsAt` and `endsAt` keep their values. `doorsOpenAt` stops copying
  `startsAt`, a one-time break announced to Broadcast before release. The
  date-only schedule kind is removed.
- From here on, v1 changes are additive: no field changes meaning or becomes
  nullable, and null means not stated.
- Studio and the form require advertised start and end; door and program
  times are optional and never inferred. Importers extract the four kinds
  separately.
- Times are Oslo clock times stored as `HH:MM`. Each resolves to the first
  instant at or after the previous time where the clock shows it, starting
  from doors open or the advertised start; a time in the skipped spring hour
  moves forward an hour. This covers past-midnight times and both
  daylight-saving transitions without asking anyone.
- Out-of-order times are errors. More than 6 hours from doors to program, or
  12 hours in total, is a warning.
- Our write paths reject invalid times. Other writes are caught by a CI and
  scheduled audit that alerts editors. The feed never silently drops an
  occurrence.
- Dates whose times were written after 2026-10-06T18:26Z, when Studio began
  labelling them as door times, get those times copied into the door fields,
  selected from Sanity transaction history.

### Occurrence identity

- An occurrence ID is assigned once and never derived from the schedule.
  Rescheduling edits the existing date entry.
- New series instances get opaque IDs and record their generated occurrence.
  Regeneration matches existing instances, editors confirm moves when the
  recurrence changes, and instances are cancelled, never deleted. Slugs are
  fixed at creation.
- Once public, an event is withdrawn only by cancelling. Delete and unpublish
  are admin-only for events that were never public; unapproving or marking a
  public event internal is blocked.
- An occurrence missing from the snapshot while still in range is an error:
  consumers keep its last state and the audit reports it.

## Consequences

Broadcast reads `startsAt` and `endsAt` unchanged, now with a defined meaning,
and can adopt the new fields at any time. Existing IDs and slugs stay valid.
Editors gain confirmation steps for recurrence changes and for removing
public dates. Anything promised to a consumer must first be covered by a
contract test or the audit.

Open: who receives audit alerts, and how long past occurrences stay in the
feed (Broadcast was told six months).

## Verification

    npm --workspace @samfunnet/web run events:audit:broadcast

Tests cover non-null advertised times, past-midnight and daylight-saving
resolution, the migration leaving `startsAt` and `endsAt` unchanged, and
occurrence IDs surviving reschedules and regeneration.
