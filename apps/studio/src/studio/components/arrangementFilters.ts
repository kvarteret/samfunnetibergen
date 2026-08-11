export type ArrangementFormat = "all" | "single" | "recurring" | "festivals"

export type ArrangementListStatus =
  | "approved"
  | "completed"
  | "archived"
  | "cancelled"

export const ARRANGEMENT_LIST_STATUS_LABELS: Record<
  ArrangementListStatus,
  string
> = {
  approved: "Godkjent",
  completed: "Gjennomført",
  archived: "Arkivert",
  cancelled: "Kansellert",
}

export type ArrangementFilterState = {
  format: ArrangementFormat
  status: ArrangementListStatus
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
  format: "all",
  status: "approved",
  taxonomyGroupId: null,
  eventTypeId: null,
  query: "",
})

export function todayInOslo(date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Oslo",
  }).format(date)
}

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

export function latestArrangementDate(item: ArrangementBrowserItem) {
  return [
    ...(item.dates ?? []).flatMap(date =>
      date.startDate ? [date.startDate] : [],
    ),
    ...(item.childDates ?? []),
  ]
    .filter(Boolean)
    .sort()
    .at(-1)
}

function halfYearStart(today: string) {
  const year = today.slice(0, 4)
  const month = Number(today.slice(5, 7))
  return `${year}-${month >= 7 ? "07" : "01"}-01`
}

export function arrangementListStatus(
  item: ArrangementBrowserItem,
  today: string,
): ArrangementListStatus {
  const eventStatus = item.eventStatus ?? "scheduled"
  const latestDate = latestArrangementDate(item)

  if (!latestDate || latestDate >= today) {
    return eventStatus === "cancelled" ? "cancelled" : "approved"
  }
  if (eventStatus === "cancelled" || latestDate < halfYearStart(today)) {
    return "archived"
  }
  return "completed"
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
      if (arrangementListStatus(item, today) !== filters.status) return false
      if (
        filters.taxonomyGroupId &&
        item.eventType?.taxonomyGroup?._id !== filters.taxonomyGroupId
      )
        return false
      if (filters.eventTypeId && item.eventType?._id !== filters.eventTypeId)
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
