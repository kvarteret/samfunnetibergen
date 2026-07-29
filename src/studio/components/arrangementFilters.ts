export type ArrangementPreset =
  | "arrangements"
  | "recurring"
  | "festivals"
  | "promoted"

export type ArrangementFilterState = {
  date: "all" | "upcoming" | "past"
  visibility: "approved" | "paused" | "archived" | "all"
  eventStatus: "all" | "scheduled" | "cancelled" | "postponed"
  taxonomyGroupId: string | null
  eventTypeId: string | null
  query: string
  preset: ArrangementPreset
}

export type ArrangementBrowserItem = {
  _id: string
  title?: string | null
  eventKind?: string | null
  approvalStatus?: string | null
  eventStatus?: string | null
  isRecurring?: boolean | null
  isPromoted?: boolean | null
  dates?: Array<{ startDate?: string | null; startTime?: string | null }> | null
  eventType?: {
    _id: string
    name?: string | null
    taxonomyGroup?: { _id: string; name?: string | null } | null
  } | null
  childDates?: string[] | null
}

export const defaultArrangementFilters = (
  preset: ArrangementPreset,
): ArrangementFilterState => ({
  date: "all",
  visibility: "approved",
  eventStatus: "scheduled",
  taxonomyGroupId: null,
  eventTypeId: null,
  query: "",
  preset,
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
      if (
        filters.preset === "arrangements" &&
        !["single", "seriesParent"].includes(kind)
      )
        return false
      if (
        filters.preset === "recurring" &&
        (kind !== "seriesParent" || item.isRecurring !== true)
      )
        return false
      if (filters.preset === "festivals" && kind !== "festivalParent")
        return false
      if (filters.preset === "promoted" && item.isPromoted !== true)
        return false
      if (
        filters.visibility !== "all" &&
        (item.approvalStatus ?? "pending") !== filters.visibility
      )
        return false
      if (
        filters.eventStatus !== "all" &&
        (item.eventStatus ?? "scheduled") !== filters.eventStatus
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
