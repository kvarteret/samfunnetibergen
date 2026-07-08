import { addMonths } from "date-fns"
import { RRule } from "rrule"

// Materialized-instance generation for recurring series (ADR 005).
// Everything in this module is pure: no Sanity client, no I/O, no deletion.
// The generation script, a future Studio action, and tests all share it.

export type EventStatus = "scheduled" | "cancelled" | "postponed"
export type ApprovalStatus =
  | "pending"
  | "approved"
  | "paused"
  | "rejected"
  | "archived"

export interface Occurrence {
  startDate: string
  startTime: string | null
  endTime: string | null
}

export interface GenerationSeed {
  startDate: string
  startTime?: string | null
  endTime?: string | null
}

export interface GenerationParent {
  _id: string
  slug: string
  approvalStatus: ApprovalStatus
}

export interface GeneratedInstance {
  _id: string
  _type: "arrangement"
  eventKind: "seriesInstance"
  parentEvent: { _type: "reference"; _ref: string }
  slug: { _type: "slug"; current: string }
  dates: [
    {
      _key: string
      _type: "arrangementDate"
      startDate: string
      startTime?: string
      endTime?: string
    },
  ]
  eventStatus: "scheduled"
  approvalStatus: "approved" | "pending"
}

export interface ExistingInstance {
  _id: string
  eventStatus?: EventStatus | null
  approvalStatus?: ApprovalStatus | null
  dates?: Array<{
    startDate?: string | null
    startTime?: string | null
    endTime?: string | null
  }> | null
  /** True when the document carries any inheritable content override
   * (title, description, image, pricing, links, …). The caller computes
   * this from the raw document; generation never sets those fields. */
  hasContentOverrides: boolean
}

export interface InstanceDiff {
  toCreate: Occurrence[]
  orphanedUntouched: ExistingInstance[]
  orphanedEdited: ExistingInstance[]
}

const GENERATION_HORIZON_MONTHS = 6

/** Strip a `drafts.` prefix so draft and published parents yield the same
 * child ids (Decision D3 in execplan 008). */
export function publishedIdOf(id: string): string {
  return id.replace(/^drafts\./, "")
}

/** `2026-08-03` or `2026-08-03-1900` — the deterministic per-occurrence
 * token used in child `_id`, slug, and date `_key`. The time suffix
 * disambiguates two occurrences on the same date. */
export function occurrenceToken(occurrence: Occurrence): string {
  if (!occurrence.startTime) return occurrence.startDate
  return `${occurrence.startDate}-${occurrence.startTime.replace(":", "")}`
}

export function instanceIdFor(
  parentId: string,
  occurrence: Occurrence,
): string {
  const publicParentId = publishedIdOf(parentId).replaceAll(".", "-")
  return `arrangement-${publicParentId}-${occurrenceToken(occurrence)}`
}

/** Invert `occurrenceToken`: recover the generated date and start time from
 * a child `_id`. Supports both the current root-path id shape and the legacy
 * dotted id shape, whose documents are private to unauthenticated Sanity
 * clients. Returns null when the id is not generation-shaped. The end time is
 * not encoded in the token; callers compare it against the seed. */
export function occurrenceFromInstanceId(
  id: string,
): { startDate: string; startTime: string | null } | null {
  const match = id.match(/(?:^|[.-])(\d{4}-\d{2}-\d{2})(?:-(\d{2})(\d{2}))?$/)
  if (!match) return null
  const [, startDate, hours, minutes] = match
  return { startDate, startTime: hours ? `${hours}:${minutes}` : null }
}

export function instanceSlugFor(
  parentSlug: string,
  occurrence: Occurrence,
): string {
  return `${parentSlug}-${occurrenceToken(occurrence)}`
}

/** Expand an iCal RRULE from the seed date into concrete occurrences,
 * capped at six months after the seed date (inclusive of the seed
 * occurrence when the rule includes it).
 *
 * Date arithmetic is anchored at noon UTC: noon UTC is always 13:00 or
 * 14:00 in Europe/Oslo, so `toISOString().slice(0, 10)` never shifts a
 * calendar day across either DST transition. Times are copied from the
 * seed onto every occurrence — the rule only decides dates. */
export function expandOccurrences(
  rrule: string,
  seed: GenerationSeed,
): Occurrence[] {
  const dtstart = new Date(`${seed.startDate}T12:00:00Z`)
  if (Number.isNaN(dtstart.getTime())) return []

  let rule: RRule
  try {
    rule = new RRule({ ...RRule.parseString(rrule), dtstart })
  } catch {
    return []
  }

  const horizon = addMonths(dtstart, GENERATION_HORIZON_MONTHS)

  return rule.between(dtstart, horizon, true).map(date => ({
    startDate: date.toISOString().slice(0, 10),
    startTime: seed.startTime ?? null,
    endTime: seed.endTime ?? null,
  }))
}

/** Build the complete child document generation would write. Inheritable
 * content fields (title, description, image, pricing, links, SEO, …) are
 * deliberately absent so the child inherits everything from the parent
 * until an editor overrides a field (execplan 008, Decision D7). */
export function buildInstanceDocument(
  parent: GenerationParent,
  occurrence: Occurrence,
): GeneratedInstance {
  const token = occurrenceToken(occurrence)
  return {
    _id: instanceIdFor(parent._id, occurrence),
    _type: "arrangement",
    eventKind: "seriesInstance",
    parentEvent: { _type: "reference", _ref: publishedIdOf(parent._id) },
    slug: { _type: "slug", current: instanceSlugFor(parent.slug, occurrence) },
    dates: [
      {
        _key: token,
        _type: "arrangementDate",
        startDate: occurrence.startDate,
        ...(occurrence.startTime ? { startTime: occurrence.startTime } : {}),
        ...(occurrence.endTime ? { endTime: occurrence.endTime } : {}),
      },
    ],
    eventStatus: "scheduled",
    approvalStatus:
      parent.approvalStatus === "approved" ? "approved" : "pending",
  }
}

/** Structural "untouched" check (Decision D6): a child is untouched exactly
 * when it still looks like what generation would produce — scheduled, the
 * generated approval status, no content overrides, and a single date entry
 * matching the occurrence encoded in its deterministic `_id` (and the
 * seed's end time, when a seed is available to compare against). Untouched
 * orphans are safe for an editor to bulk-delete; edited orphans always
 * require a per-document decision. */
function isUntouched(
  existing: ExistingInstance,
  parent: GenerationParent,
  seed: GenerationSeed | undefined,
): boolean {
  if ((existing.eventStatus ?? "scheduled") !== "scheduled") return false
  const generatedApproval =
    parent.approvalStatus === "approved" ? "approved" : "pending"
  if ((existing.approvalStatus ?? "pending") !== generatedApproval) return false
  if (existing.hasContentOverrides) return false

  const generated = occurrenceFromInstanceId(existing._id)
  if (!generated) return false
  const dates = existing.dates ?? []
  if (dates.length !== 1) return false
  const [date] = dates
  if (date.startDate !== generated.startDate) return false
  if ((date.startTime ?? null) !== generated.startTime) return false
  if (seed && (date.endTime ?? null) !== (seed.endTime ?? null)) return false
  return true
}

/** Diff planned occurrences against existing children of the same parent.
 * Existing documents are matched by deterministic `_id`; rerunning
 * generation with an unchanged rule therefore yields an empty diff. Pass
 * the seed when available so orphan end-time edits are detected too. */
export function diffInstances(
  parent: GenerationParent,
  planned: Occurrence[],
  existing: ExistingInstance[],
  seed?: GenerationSeed,
): InstanceDiff {
  const plannedById = new Map(
    planned.map(occurrence => [
      instanceIdFor(parent._id, occurrence),
      occurrence,
    ]),
  )
  const existingById = new Map(
    existing.map(instance => [instance._id, instance]),
  )

  const toCreate = [...plannedById.entries()]
    .filter(([id]) => !existingById.has(id))
    .map(([, occurrence]) => occurrence)

  const orphanedUntouched: ExistingInstance[] = []
  const orphanedEdited: ExistingInstance[] = []

  for (const instance of existing) {
    if (plannedById.has(instance._id)) continue
    if (isUntouched(instance, parent, seed)) {
      orphanedUntouched.push(instance)
    } else {
      orphanedEdited.push(instance)
    }
  }

  return { toCreate, orphanedUntouched, orphanedEdited }
}
