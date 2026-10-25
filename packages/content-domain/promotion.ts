/** How many arrangements the front page and info screen feature at once. */
export const FEATURED_SLOT_COUNT = 3

/** A series is only picked automatically when it is a short run, not a semester-long weekly series. */
export const AUTO_SERIES_MAX_SPAN_DAYS = 14

const PROMOTABLE_KINDS = ["single", "seriesParent", "festivalParent"]

export type AutoPromotionCandidate = {
  _id: string
  eventKind?: string | null
  eventStatus?: string | null
  hasImage: boolean
  isSoldOut?: boolean | null
  organizerId?: string | null
  dates: Array<{
    startDate: string
    startTime?: string | null
    isSoldOut?: boolean | null
  }>
}

function daysBetween(first: string, second: string) {
  return (
    (Date.parse(`${second}T12:00:00Z`) - Date.parse(`${first}T12:00:00Z`)) /
    86_400_000
  )
}

function nextStart(candidate: AutoPromotionCandidate, today: string) {
  return candidate.dates
    .filter(date => date.startDate >= today && !date.isSoldOut)
    .map(date => `${date.startDate}T${date.startTime ?? "00:00"}`)
    .sort()[0]
}

/** Whether an arrangement may ever fill an automatic slot. */
export function isAutoPromotable(
  candidate: AutoPromotionCandidate,
  today: string,
) {
  if (!PROMOTABLE_KINDS.includes(candidate.eventKind ?? "single")) return false
  if (candidate.eventStatus === "cancelled" || candidate.isSoldOut) return false
  if (!nextStart(candidate, today)) return false
  if (candidate.eventKind === "seriesParent") {
    const upcoming = candidate.dates
      .map(date => date.startDate)
      .filter(date => date >= today)
      .sort()
    const first = upcoming[0]
    const last = upcoming.at(-1)
    if (!first || !last) return false
    if (daysBetween(first, last) > AUTO_SERIES_MAX_SPAN_DAYS) return false
  }
  return true
}

/**
 * Picks arrangements for the featured slots that editors left empty.
 *
 * Soonest upcoming first, skipping cancelled and sold-out arrangements and
 * long-running weekly series. It prefers arrangements with an image and at
 * most one per organizer, and relaxes those two preferences, in that order,
 * only when there are too few candidates to fill every slot.
 */
export function pickAutoPromotions<T extends AutoPromotionCandidate>(
  candidates: T[],
  {
    count,
    excludeIds = [],
    today,
  }: { count: number; excludeIds?: Iterable<string>; today: string },
): T[] {
  if (count <= 0) return []
  const excluded = new Set(excludeIds)
  const eligible = [
    ...new Map(
      candidates.map(candidate => [candidate._id, candidate]),
    ).values(),
  ]
    .filter(candidate => !excluded.has(candidate._id))
    .filter(candidate => isAutoPromotable(candidate, today))
    .sort(
      (first, second) =>
        (nextStart(first, today) ?? "").localeCompare(
          nextStart(second, today) ?? "",
        ) || first._id.localeCompare(second._id),
    )

  const picked: T[] = []
  const passes: Array<(candidate: T) => boolean> = [
    candidate =>
      candidate.hasImage &&
      !picked.some(
        other =>
          candidate.organizerId && other.organizerId === candidate.organizerId,
      ),
    candidate => candidate.hasImage,
    () => true,
  ]
  for (const accepts of passes) {
    for (const candidate of eligible) {
      if (picked.length >= count) return picked
      if (!picked.includes(candidate) && accepts(candidate)) {
        picked.push(candidate)
      }
    }
  }
  return picked
}
