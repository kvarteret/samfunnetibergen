import { RRule } from "rrule"

// Materialized-instance generation for recurring series (ADR 005).
// Everything in this module is pure: no Sanity client, no I/O, no deletion.
// The generation script, a future Studio action, and tests all share it.

export type EventStatus = "scheduled" | "cancelled"
export type ApprovalStatus = "pending" | "approved" | "rejected"

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

export interface SemesterWindow {
  code: string
  label: string
  startDate: string
  endDate: string
}

export function semesterForCode(code: string): SemesterWindow | null {
  const match = code.toUpperCase().match(/^([VH])(\d{2})$/)
  if (!match) return null
  const [, prefix, shortYear] = match
  const year = 2000 + Number(shortYear)
  return semesterFromIndex(year * 2 + (prefix === "H" ? 1 : 0))
}

function semesterFromIndex(index: number): SemesterWindow {
  const year = Math.floor(index / 2)
  const isSecondSemester = index % 2 === 1
  const code = `${isSecondSemester ? "H" : "V"}${String(year).slice(-2)}`
  return {
    code,
    label: code,
    startDate: `${year}-${isSecondSemester ? "08-17" : "01-03"}`,
    endDate: `${year}-${isSecondSemester ? "12-15" : "05-29"}`,
  }
}

/** Return the nearest program semester for a YYYY-MM-DD date.
 * Dates in the planned winter/summer gaps stay associated with the surrounding
 * half of the year so the semester picker always has a stable center. */
export function semesterForDate(date: string): SemesterWindow | null {
  const match = date.match(/^(\d{4})-(\d{2})-\d{2}$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  if (month < 1 || month > 12) return null
  return semesterFromIndex(year * 2 + (month >= 7 ? 1 : 0))
}

/** List adjacent semester windows in chronological order. */
export function semesterWindowsAround(
  date: string,
  before = 1,
  after = 2,
): SemesterWindow[] {
  const semester = semesterForDate(date)
  if (!semester) return []
  const year = Number(semester.startDate.slice(0, 4))
  const center = year * 2 + (semester.code.startsWith("H") ? 1 : 0)
  return Array.from({ length: before + after + 1 }, (_, offset) =>
    semesterFromIndex(center - before + offset),
  )
}

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

/** Expand a recurrence only inside an explicit inclusive date window.
 * The rule stays anchored to the series seed, so selecting a later semester
 * preserves weekly/monthly alignment. COUNT and UNTIL from legacy rules are
 * deliberately ignored: the selected semester is the sole range
 * authority, while the RRULE only describes cadence. */
export function expandOccurrencesInRange(
  rrule: string,
  seed: GenerationSeed,
  range: Pick<SemesterWindow, "startDate" | "endDate">,
): Occurrence[] {
  const dtstart = new Date(`${seed.startDate}T12:00:00Z`)
  const rangeStart = new Date(`${range.startDate}T12:00:00Z`)
  const rangeEnd = new Date(`${range.endDate}T12:00:00Z`)
  if (
    [dtstart, rangeStart, rangeEnd].some(date =>
      Number.isNaN(date.getTime()),
    ) ||
    rangeStart > rangeEnd ||
    rangeEnd < dtstart
  ) {
    return []
  }

  let rule: RRule
  try {
    const options = RRule.parseString(rrule)
    delete options.count
    delete options.until
    rule = new RRule({ ...options, dtstart })
  } catch {
    return []
  }

  const effectiveStart = rangeStart < dtstart ? dtstart : rangeStart

  return rule.between(effectiveStart, rangeEnd, true).map(date => ({
    startDate: date.toISOString().slice(0, 10),
    startTime: seed.startTime ?? null,
    endTime: seed.endTime ?? null,
  }))
}

/** Build the complete child document generation would write. Inheritable
 * content fields (title, description, image, pricing, links, …) are
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
