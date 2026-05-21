import type { fetchPublishedArrangements } from "@/lib/sanity/fetch"

export type PublishedArrangement = Awaited<ReturnType<typeof fetchPublishedArrangements>>[number]

export type ArrangementTaxonomyGroup = {
    _id: string
    name: string
}

export type ArrangementEventType = {
    _id: string
    name: string
    taxonomyGroupName: string
}

export type ArrangementOrganizerGroup = {
    _id: string
    name: string
}

export type ArrangementTaxonomy = {
    taxonomyGroups: ArrangementTaxonomyGroup[]
    eventTypes: ArrangementEventType[]
    organizerGroups: ArrangementOrganizerGroup[]
}

export type ArrangementFilters = {
    taxonomyGroupName: string | null
    eventTypeIds: string[]
    organizerGroupIds: string[]
}

export function buildTaxonomyFromArrangements(
    arrangements: PublishedArrangement[],
): ArrangementTaxonomy {
    const taxonomyGroupsMap = new Map<string, ArrangementTaxonomyGroup>()
    const eventTypesMap = new Map<string, ArrangementEventType>()
    const organizerGroupsMap = new Map<string, ArrangementOrganizerGroup>()

    for (const a of arrangements) {
        if (a.eventType) {
            if (a.eventType.taxonomyGroup) {
                taxonomyGroupsMap.set(a.eventType.taxonomyGroup._id, {
                    _id: a.eventType.taxonomyGroup._id,
                    name: a.eventType.taxonomyGroup.name,
                })
            }
            eventTypesMap.set(a.eventType._id, {
                _id: a.eventType._id,
                name: a.eventType.name,
                taxonomyGroupName: a.eventType.taxonomyGroup?.name ?? "Annet",
            })
        }
        if (a.organizerGroup) {
            organizerGroupsMap.set(a.organizerGroup._id, {
                _id: a.organizerGroup._id,
                name: a.organizerGroup.name,
            })
        }
    }

    return {
        taxonomyGroups: [...taxonomyGroupsMap.values()],
        eventTypes: [...eventTypesMap.values()],
        organizerGroups: [...organizerGroupsMap.values()],
    }
}

export function filterArrangements(
    arrangements: PublishedArrangement[],
    filters: ArrangementFilters,
): PublishedArrangement[] {
    const eventTypeIds = new Set(filters.eventTypeIds)
    const organizerGroupIds = new Set(filters.organizerGroupIds)

    return arrangements.filter(a => {
        if (
            filters.taxonomyGroupName !== null &&
            a.eventType?.taxonomyGroup?.name !== filters.taxonomyGroupName
        ) {
            return false
        }
        if (eventTypeIds.size > 0 && !eventTypeIds.has(a.eventType?._id ?? "")) {
            return false
        }
        if (organizerGroupIds.size > 0 && !organizerGroupIds.has(a.organizerGroup?._id ?? "")) {
            return false
        }
        return true
    })
}

export function countArrangementFilters(filters: ArrangementFilters): number {
    return (
        (filters.taxonomyGroupName !== null ? 1 : 0) +
        filters.eventTypeIds.length +
        filters.organizerGroupIds.length
    )
}

export function parseArrangementFilters(
    searchParams: Record<string, string | string[] | undefined>,
): ArrangementFilters {
    const taxonomy = searchParams.taxonomy
    const type = searchParams.type
    const organizer = searchParams.organizer

    const taxonomyGroupName = Array.isArray(taxonomy) ? (taxonomy[0] ?? null) : (taxonomy ?? null)

    const toIds = (value: string | string[] | undefined): string[] => {
        if (!value) return []
        return (Array.isArray(value) ? value : value.split(",")).map(s => s.trim()).filter(Boolean)
    }

    return {
        taxonomyGroupName,
        eventTypeIds: toIds(type),
        organizerGroupIds: toIds(organizer),
    }
}

export function serializeArrangementFilters(filters: ArrangementFilters): string {
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
