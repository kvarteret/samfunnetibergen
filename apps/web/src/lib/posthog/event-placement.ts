export type PromotionContext = {
  initialSlug?: string | null
  isPromoted?: boolean | null
  promotedPlacement?: "top" | "pool" | null
  promotedOrder?: number | null
  promotionCampaignId?: string | null
}

export function promotionProperties(event: PromotionContext) {
  return {
    is_promoted: event.isPromoted === true,
    promotion_placement: event.isPromoted
      ? (event.promotedPlacement ?? "legacy")
      : "none",
    promotion_order: event.isPromoted ? (event.promotedOrder ?? null) : null,
    promotion_campaign_id: event.isPromoted
      ? (event.promotionCampaignId ?? null)
      : null,
  }
}

export function placementProperties(element: HTMLElement, locale: string) {
  return {
    event_id: element.dataset.eventId,
    event_document_id: element.dataset.eventDocumentId,
    event_slug: element.dataset.eventSlug,
    surface: element.dataset.eventSurface,
    position: Number(element.dataset.eventPosition) || null,
    locale,
    is_promoted: element.dataset.eventPromoted === "true",
    promotion_placement: element.dataset.eventPromotionPlacement ?? "none",
    promotion_order: element.dataset.eventPromotionOrder
      ? Number(element.dataset.eventPromotionOrder)
      : null,
    promotion_campaign_id: element.dataset.eventCampaignId || null,
    occurrence_date: element.dataset.eventOccurrenceDate || null,
    placement_id: element.dataset.eventPlacementId,
    tracking_version: 1,
  }
}
