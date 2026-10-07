import type { PublicEvent } from "./events"

export type TaxonomyGroup = {
  _id: string
  name: string
}

export type TaxonomyEventType = {
  _id: string
  name: string
  taxonomyGroupName: string
}

export type OrganizerGroup = {
  _id: string
  name: string
}

export type EventTaxonomy = {
  taxonomyGroups: TaxonomyGroup[]
  eventTypes: TaxonomyEventType[]
  organizerGroups: OrganizerGroup[]
}

/** The fields the taxonomy filters read; satisfied by public events and statistics rows. */
export type FilterableEvent = {
  eventType?: {
    _id: string
    name: string
    taxonomyGroup?: { _id: string; name: string } | null
  } | null
  organizerGroup?: { _id: string; name: string } | null
  coOrganizerGroups?: Array<{ _id: string; name: string }> | null
}

/** The main organizer followed by co-organizers. */
export function organizerGroupsOf(event: FilterableEvent) {
  return [
    ...(event.organizerGroup ? [event.organizerGroup] : []),
    ...(event.coOrganizerGroups ?? []),
  ]
}

export type EventFilters = {
  taxonomyGroupName: string | null
  eventTypeIds: string[]
  organizerGroupIds: string[]
}

export function buildTaxonomyFromEvents(
  events: readonly FilterableEvent[],
): EventTaxonomy {
  const taxonomyGroupsMap = new Map<string, TaxonomyGroup>()
  const eventTypesMap = new Map<string, TaxonomyEventType>()
  const organizerGroupsMap = new Map<string, OrganizerGroup>()

  for (const e of events) {
    if (e.eventType) {
      if (e.eventType.taxonomyGroup) {
        taxonomyGroupsMap.set(e.eventType.taxonomyGroup._id, {
          _id: e.eventType.taxonomyGroup._id,
          name: e.eventType.taxonomyGroup.name,
        })
      }
      eventTypesMap.set(e.eventType._id, {
        _id: e.eventType._id,
        name: e.eventType.name,
        taxonomyGroupName: e.eventType.taxonomyGroup?.name ?? "Annet",
      })
    }
    for (const group of organizerGroupsOf(e)) {
      organizerGroupsMap.set(group._id, { _id: group._id, name: group.name })
    }
  }

  return {
    taxonomyGroups: [...taxonomyGroupsMap.values()],
    eventTypes: [...eventTypesMap.values()],
    organizerGroups: [...organizerGroupsMap.values()],
  }
}

export function filterEvents<T extends FilterableEvent>(
  events: readonly T[],
  filters: EventFilters,
): T[] {
  const eventTypeIds = new Set(filters.eventTypeIds)
  const organizerGroupIds = new Set(filters.organizerGroupIds)

  return events.filter(e => {
    if (
      filters.taxonomyGroupName !== null &&
      e.eventType?.taxonomyGroup?.name !== filters.taxonomyGroupName
    ) {
      return false
    }
    if (eventTypeIds.size > 0 && !eventTypeIds.has(e.eventType?._id ?? "")) {
      return false
    }
    if (
      organizerGroupIds.size > 0 &&
      !organizerGroupsOf(e).some(group => organizerGroupIds.has(group._id))
    ) {
      return false
    }
    return true
  })
}

/**
 * Keep the first concrete day for each series or festival in the card list.
 * Generated children are already ordered by their first future date at the
 * Sanity boundary, so preserving input order makes the first row the earliest
 * visible instance without changing the shared query used by other surfaces.
 */
export function filterToFirstInstances(
  events: PublicEvent[],
  featuredFestivalIds: ReadonlySet<string> = new Set(),
): PublicEvent[] {
  const seenParents = new Set<string>()

  return events.filter(event => {
    if (
      event.eventKind === "festivalSession" &&
      event.parentEvent &&
      featuredFestivalIds.has(event.parentEvent._id)
    ) {
      return false
    }

    const isMaterializedInstance =
      event.eventKind === "seriesInstance" ||
      event.eventKind === "festivalSession"

    if (!isMaterializedInstance) return true

    const parentId = event.parentEvent?._id ?? event._id
    if (seenParents.has(parentId)) return false

    seenParents.add(parentId)
    return true
  })
}

export function countEventFilters(filters: EventFilters): number {
  return (
    (filters.taxonomyGroupName !== null ? 1 : 0) +
    filters.eventTypeIds.length +
    filters.organizerGroupIds.length
  )
}

export function parseEventFilters(
  searchParams: Record<string, string | string[] | undefined>,
): EventFilters {
  const taxonomy = searchParams.taxonomy
  const type = searchParams.type
  const organizer = searchParams.organizer

  const taxonomyGroupName = Array.isArray(taxonomy)
    ? (taxonomy[0] ?? null)
    : (taxonomy ?? null)

  const toIds = (value: string | string[] | undefined): string[] => {
    if (!value) return []
    return (Array.isArray(value) ? value : value.split(","))
      .map(s => s.trim())
      .filter(s => s.length > 0)
  }

  return {
    taxonomyGroupName,
    eventTypeIds: toIds(type),
    organizerGroupIds: toIds(organizer),
  }
}

export function serializeEventFilters(filters: EventFilters): string {
  const params = new URLSearchParams()

  if (filters.taxonomyGroupName) {
    params.set("taxonomy", filters.taxonomyGroupName)
  }
  if (filters.eventTypeIds.length > 0) {
    params.set("type", filters.eventTypeIds.join(","))
  }
  if (filters.organizerGroupIds.length > 0) {
    params.set("organizer", filters.organizerGroupIds.join(","))
  }

  return params.toString()
}
