// Inheritance and effective-status resolution for materialized event
// instances (ADR 005). Pure functions shared by website, feed, and app:
// this module is the single place that defines which fields a child may
// inherit from its parent and how real-world status resolves.

export type EventStatus = "scheduled" | "cancelled" | "postponed"

/** The complete set of fields a child may inherit from its parent
 * (execplan 008, Decision D7). Everything else — isPromoted, eventStatus,
 * approvalStatus, slug, dates, room/location, eventKind, parentEvent,
 * submission metadata — never inherits, enforced by this list being the
 * only thing the resolver reads from the parent. */
export const INHERITED_FIELDS = [
  "title",
  "description",
  "imageUrl",
  "imageCaption",
  "organizerGroup",
  "organizerText",
  "eventType",
  "isFree",
  "priceOrdinar",
  "priceStudent",
  "priceMedlem",
  "ticketUrl",
  "facebookUrl",
  "isInternalEvent",
  "seoTitle",
  "seoDescription",
  "openGraphTitle",
  "openGraphDescription",
  "openGraphImageUrl",
  "openGraphImageAlt",
] as const

export type InheritedField = (typeof INHERITED_FIELDS)[number]

export type InheritableContent = Partial<Record<InheritedField, unknown>>

/** Field-level fallback: for every inheritable field, the child's value
 * wins when it is present (not null/undefined) — including falsy overrides
 * like `isFree: false` — otherwise the parent's value fills in. All
 * non-inherited child fields pass through untouched; parent fields outside
 * the inherited set never leak into the result. */
export function resolveEventContent<Child extends object>(
  child: Child,
  parent: InheritableContent | null | undefined,
): Child & InheritableContent {
  const resolved: Record<string, unknown> = {
    ...(child as Record<string, unknown>),
  }
  if (!parent) return resolved as Child & InheritableContent

  for (const field of INHERITED_FIELDS) {
    if (resolved[field] == null && parent[field] != null) {
      resolved[field] = parent[field]
    }
  }
  return resolved as Child & InheritableContent
}

/** Effective real-world status: the child's own non-scheduled status always
 * wins; otherwise a non-scheduled parent status (cancelled festival) applies
 * to its scheduled children; otherwise scheduled. Missing statuses read as
 * scheduled. */
export function resolveEffectiveStatus(
  childStatus: EventStatus | null | undefined,
  parentStatus?: EventStatus | null,
): EventStatus {
  const child = childStatus ?? "scheduled"
  if (child !== "scheduled") return child
  const parent = parentStatus ?? "scheduled"
  return parent !== "scheduled" ? parent : "scheduled"
}

const SCHEMA_ORG_EVENT_STATUS: Record<EventStatus, string> = {
  scheduled: "https://schema.org/EventScheduled",
  cancelled: "https://schema.org/EventCancelled",
  postponed: "https://schema.org/EventPostponed",
}

export function schemaOrgEventStatus(status: EventStatus): string {
  return SCHEMA_ORG_EVENT_STATUS[status]
}
