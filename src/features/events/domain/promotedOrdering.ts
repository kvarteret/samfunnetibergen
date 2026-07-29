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
  const orderedEvents = [...events].sort((first, second) =>
    comparePromotedEvents(first, second, today),
  )
  if (!orderedEvents.some(event => event.promotedPlacement)) {
    return orderedEvents.slice(0, 3)
  }
  const visibleEvents = orderedEvents.filter(
    event => event.promotedPlacement === "top",
  )
  const queuedEvents = orderedEvents.filter(
    event => event.promotedPlacement === "pool",
  )
  const configuredVisibleCount = Math.min(
    3,
    Math.max(
      1,
      queuedEvents.find(event => typeof event.promotedOrder === "number")
        ?.promotedOrder ?? visibleEvents.length,
    ),
  )
  return [...visibleEvents, ...queuedEvents].slice(0, configuredVisibleCount)
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
