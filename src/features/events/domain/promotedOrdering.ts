type PromotedOrderableEvent = {
  orderRank?: string | null
  dates?: Array<{
    startDate: string
    startTime?: string | null
  }> | null
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
  return event.orderRank
    ? `0-${event.orderRank}`
    : `1-${eventStartSortKey(event, today)}`
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
