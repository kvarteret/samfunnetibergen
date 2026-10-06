export type PromotionContext = {
  initialSlug?: string | null
  isPromoted?: boolean | null
  promotedPlacement?: "top" | "pool" | null
  promotedOrder?: number | null
}

export function promotionProperties(event: PromotionContext) {
  return {
    is_promoted: event.isPromoted === true,
    promotion_placement: event.isPromoted
      ? (event.promotedPlacement ?? "legacy")
      : "none",
    promotion_order: event.isPromoted ? (event.promotedOrder ?? null) : null,
  }
}

export function placementProperties(element: HTMLElement, locale: string) {
  const title = element.dataset.eventTitle || element.dataset.eventSlug
  const surface = element.dataset.eventSurface
  const placement =
    {
      "home-promoted": "Frontpage — promoted",
      "home-upcoming": "Frontpage — upcoming",
      "events-list": "Arrangementer",
      calendar: "Kalender",
      "detail-parent": "Event page — parent event",
      "detail-child": "Event page — child events",
    }[surface ?? ""] ?? surface
  return {
    event_id: element.dataset.eventId,
    event_document_id: element.dataset.eventDocumentId,
    event_slug: element.dataset.eventSlug,
    event_title: title,
    surface,
    placement_name: placement,
    summary: `${title} · ${placement}`,
    position: Number(element.dataset.eventPosition) || null,
    locale,
    is_promoted: element.dataset.eventPromoted === "true",
    promotion_placement: element.dataset.eventPromotionPlacement ?? "none",
    promotion_order: element.dataset.eventPromotionOrder
      ? Number(element.dataset.eventPromotionOrder)
      : null,
    occurrence_date: element.dataset.eventOccurrenceDate || null,
    placement_id: element.dataset.eventPlacementId,
    tracking_version: 2,
  }
}
