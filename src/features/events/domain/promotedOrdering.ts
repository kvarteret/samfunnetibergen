type PromotedOrderableEvent = {
  orderRank?: string | null
  promotedOrder?: number | null
  promotedPlacement?: "top" | "pool" | null
  dates?: Array<{
    startDate: string
    startTime?: string | null
  }> | null
}

export function selectHomepagePromotedEvents<T extends PromotedOrderableEvent>(
  events: T[],
  today: string,
): T[] {
  return [...events]
    .sort((first, second) => comparePromotedEvents(first, second, today))
    .slice(0, 3)
}

export function isPromotableEventKind(kind: string | null | undefined) {
  return ["single", "seriesParent", "festivalParent"].includes(kind ?? "single")
}

export function promotedCardGridStartClass(
  eventCount: number,
  index: number,
): string | undefined {
  if (eventCount === 1) return "md:col-start-3"
  if (eventCount === 2 && index === 0) return "md:col-start-2"
  return undefined
}

function eventStartSortKey(
  event: PromotedOrderableEvent,
  today: string,
): string {
  const date =
    event.dates?.find(candidate => candidate.startDate >= today) ??
    event.dates?.[0]
  return `${date?.startDate ?? "9999-12-31"}T${date?.startTime ?? "00:00"}`
}

function promotedEventSortKey(
  event: PromotedOrderableEvent,
  today: string,
): string {
  if (typeof event.promotedOrder === "number") {
    return `0-${String(event.promotedOrder).padStart(3, "0")}`
  }
  return event.orderRank
    ? `1-${event.orderRank}`
    : `2-${eventStartSortKey(event, today)}`
}

export function comparePromotedEvents(
  first: PromotedOrderableEvent,
  second: PromotedOrderableEvent,
  today: string,
): number {
  return promotedEventSortKey(first, today).localeCompare(
    promotedEventSortKey(second, today),
  )
}
