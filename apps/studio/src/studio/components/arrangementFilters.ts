export type ArrangementFormat = "all" | "single" | "recurring" | "festivals"

export type ArrangementFilterState = {
  date: "all" | "upcoming" | "past"
  format: ArrangementFormat
  status: "approved" | "paused" | "archived" | "cancelled" | "postponed" | "all"
  taxonomyGroupId: string | null
  eventTypeId: string | null
  query: string
}

export type ArrangementBrowserItem = {
  _id: string
  title?: string | null
  eventKind?: string | null
  approvalStatus?: string | null
  eventStatus?: string | null
  isRecurring?: boolean | null
  dates?: Array<{ startDate?: string | null; startTime?: string | null }> | null
  eventType?: {
    _id: string
    name?: string | null
    taxonomyGroup?: { _id: string; name?: string | null } | null
  } | null
  childDates?: string[] | null
}

export const defaultArrangementFilters = (): ArrangementFilterState => ({
  date: "upcoming",
  format: "all",
  status: "approved",
  taxonomyGroupId: null,
  eventTypeId: null,
  query: "",
})

export function normalizeDocumentId(id: string): string {
  return id.replace(/^drafts\./, "")
}

export function deduplicatePreviewDocuments(
  documents: ArrangementBrowserItem[],
): ArrangementBrowserItem[] {
  const byId = new Map<string, ArrangementBrowserItem>()
  for (const document of documents) {
    const id = normalizeDocumentId(document._id)
    const current = byId.get(id)
    if (!current || document._id.startsWith("drafts.")) {
      byId.set(id, { ...document, _id: id })
    }
  }
  return [...byId.values()]
}

function hasDate(
  item: ArrangementBrowserItem,
  today: string,
  relation: "upcoming" | "past",
) {
  const dates = [
    ...(item.dates ?? []).flatMap(date =>
      date.startDate ? [date.startDate] : [],
    ),
    ...(item.childDates ?? []),
  ]
  return relation === "upcoming"
    ? dates.some(date => date >= today)
    : dates.length > 0 && dates.every(date => date < today)
}

function arrangementStatus(
  item: ArrangementBrowserItem,
): Exclude<ArrangementFilterState["status"], "all"> | "other" {
  const approvalStatus = item.approvalStatus ?? "pending"
  if (approvalStatus === "paused" || approvalStatus === "archived")
    return approvalStatus
  if (approvalStatus !== "approved") return "other"

  const eventStatus = item.eventStatus ?? "scheduled"
  if (eventStatus === "cancelled" || eventStatus === "postponed")
    return eventStatus
  return "approved"
}

export function filterArrangements(
  items: ArrangementBrowserItem[],
  filters: ArrangementFilterState,
  today: string,
): ArrangementBrowserItem[] {
  const query = filters.query.trim().toLocaleLowerCase("nb")
  return deduplicatePreviewDocuments(items)
    .filter(item => {
      const kind = item.eventKind ?? "single"
      if (!["single", "seriesParent", "festivalParent"].includes(kind))
        return false
      if (filters.format === "single" && kind !== "single") return false
      if (
        filters.format === "recurring" &&
        (kind !== "seriesParent" || item.isRecurring !== true)
      )
        return false
      if (filters.format === "festivals" && kind !== "festivalParent")
        return false
      if (
        filters.status !== "all" &&
        arrangementStatus(item) !== filters.status
      )
        return false
      if (
        filters.taxonomyGroupId &&
        item.eventType?.taxonomyGroup?._id !== filters.taxonomyGroupId
      )
        return false
      if (filters.eventTypeId && item.eventType?._id !== filters.eventTypeId)
        return false
      if (filters.date !== "all" && !hasDate(item, today, filters.date))
        return false
      if (query && !(item.title ?? "").toLocaleLowerCase("nb").includes(query))
        return false
      return true
    })
    .sort((a, b) =>
      (a.title ?? "").localeCompare(b.title ?? "", "nb", {
        sensitivity: "base",
      }),
    )
}

export function countPendingRequests(
  idsAndStatuses: Array<{
    _id: string
    approvalStatus?: string | null
    submittedByEmail?: string | null
  }>,
): number {
  return new Set(
    idsAndStatuses
      .filter(
        item =>
          Boolean(item.submittedByEmail) &&
          (item.approvalStatus ?? "pending") === "pending",
      )
      .map(item => normalizeDocumentId(item._id)),
  ).size
}
