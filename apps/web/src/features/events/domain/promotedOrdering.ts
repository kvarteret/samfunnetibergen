import {
  type AutoPromotionCandidate,
  FEATURED_SLOT_COUNT,
  pickAutoPromotions,
} from "@samfunnet/content-domain/promotion"

import type { PublicEvent } from "./events"

type PromotedOrderableEvent = {
  orderRank?: string | null
  promotedOrder?: number | null
  promotedPlacement?: "top" | "pool" | null
  dates?: Array<{
    startDate: string
    startTime?: string | null
  }> | null
}

/**
 * The editors' picks in their chosen order. Picks that have ended are no
 * longer fetched, so later picks move up into the free slots.
 */
export function selectHomepagePromotedEvents<T extends PromotedOrderableEvent>(
  events: T[],
  today: string,
): T[] {
  return [...events]
    .sort((first, second) => comparePromotedEvents(first, second, today))
    .slice(0, FEATURED_SLOT_COUNT)
}

export function autoPromotionCandidate(
  event: PublicEvent,
): AutoPromotionCandidate {
  return {
    _id: event._id,
    eventKind: event.eventKind,
    eventStatus: event.eventStatus,
    hasImage: Boolean(event.imageUrl),
    isSoldOut: event.isSoldOut,
    organizerId: event.organizerGroup?._id ?? null,
    dates: event.dates,
  }
}

/** Fills the featured slots the editors left open with automatic picks. */
export function fillPromotedSlots<T extends PublicEvent>(
  selected: T[],
  candidates: T[],
  today: string,
): T[] {
  const byId = new Map(candidates.map(event => [event._id, event]))
  const automatic = pickAutoPromotions(candidates.map(autoPromotionCandidate), {
    count: FEATURED_SLOT_COUNT - selected.length,
    excludeIds: selected.map(event => event._id),
    today,
  }).flatMap(candidate => byId.get(candidate._id) ?? [])
  return [...selected, ...automatic]
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
