import type { AppLocale } from "@/i18n/routing"

const FALLBACK_TAXONOMY_GROUP = "Annet"
const PRIMARY_TAXONOMY_GROUPS = ["Musikk", "Scenekunst", "Faglig", "Sosialt", "Organisasjon"]

const TAXONOMY_GROUP_LABELS: Record<string, Record<AppLocale, string>> = {
    Musikk: { nb: "Musikk", en: "Music" },
    Scenekunst: { nb: "Scenekunst", en: "Performing arts" },
    Faglig: { nb: "Faglig", en: "Talks and debates" },
    Sosialt: { nb: "Sosialt", en: "Social events" },
    Organisasjon: { nb: "Organisasjon", en: "Organization" },
    Annet: { nb: "Annet", en: "Other events" },
}

export type EventSection = {
    key: string
    title: string
    events: EventDetail[]
}

export type EventOrganizerGroup = {
    default_event_type_id?: string | null
    id: string
    is_active: boolean
    name: string
    slug: string
    sort_order: number
}

export type EventRoom = {
    id: string
    is_active: boolean
    name: string
    slug: string
    sort_order: number
}

export type EventTranslation = {
    available?: boolean
    description?: string | null
    image_caption?: string | null
    title: string
}

export type EventTranslations = {
    en?: EventTranslation | null
    no?: EventTranslation | null
}

export type EventType = {
    description?: string | null
    id: string
    is_active: boolean
    name: string
    slug: string
    sort_order: number
    taxonomy_group: string
}

export type EventTypeGroup = {
    event_types: EventType[]
    name: string
}

export type EventDetail = {
    created_at: string
    description?: string | null
    ends_at: string
    event_type?: EventType | null
    event_type_id: string
    facebook_url?: string | null
    id: string
    image_caption?: string | null
    image_url?: string | null
    is_featured: boolean
    is_internal: boolean
    language: "no" | "en"
    organizer_groups: EventOrganizerGroup[]
    price?: string | null
    recurring_interval_days?: number | null
    room?: EventRoom | null
    room_id?: string | null
    room_text?: string | null
    slug: string
    starts_at: string
    status: "published" | "draft" | "archived"
    ticket_url?: string | null
    title: string
    translations: EventTranslations
    updated_at: string
}

export type EventList = {
    events: EventDetail[]
}

export type EventTaxonomy = {
    event_type_groups: EventTypeGroup[]
    organizer_groups: EventOrganizerGroup[]
    rooms: EventRoom[]
}

export type PublicEventsResult =
    | {
          ok: true
          events: EventDetail[]
          taxonomy: EventTaxonomy
      }
    | {
          ok: false
          events: []
          taxonomy: null
      }

export type EventFilters = {
    taxonomyGroup: string | null
    eventTypeIds: string[]
    organizerGroupIds: string[]
}

const getTaxonomyGroupName = (event: EventDetail): string =>
    event.event_type?.taxonomy_group?.trim() || FALLBACK_TAXONOMY_GROUP

export const getTaxonomyGroupLabel = (groupName: string, locale: AppLocale): string =>
    TAXONOMY_GROUP_LABELS[groupName]?.[locale] ?? groupName

export const getPrimaryTaxonomyGroups = (taxonomy: EventTaxonomy | null): string[] => {
    const availableGroups = new Set(taxonomy?.event_type_groups.map(group => group.name) ?? [])
    return PRIMARY_TAXONOMY_GROUPS.filter(groupName => availableGroups.has(groupName))
}

const normalizeSearchParamArray = (value: string | string[] | undefined): string[] => {
    if (!value) {
        return []
    }

    return (Array.isArray(value) ? value : [value])
        .flatMap(item => item.split(","))
        .map(item => item.trim())
        .filter(Boolean)
}

export function parseEventFilters(
    searchParams: Record<string, string | string[] | undefined>,
): EventFilters {
    return {
        taxonomyGroup: normalizeSearchParamArray(searchParams.taxonomy)[0] ?? null,
        eventTypeIds: normalizeSearchParamArray(searchParams.type),
        organizerGroupIds: normalizeSearchParamArray(searchParams.organizer),
    }
}

export function resolveEventFilterIds(
    filters: EventFilters,
    taxonomy: EventTaxonomy,
): EventFilters {
    const eventTypesByNameOrId = new Map<string, string>()

    for (const group of taxonomy.event_type_groups) {
        for (const eventType of group.event_types) {
            eventTypesByNameOrId.set(eventType.name, eventType.id)
        }
    }

    return {
        ...filters,
        eventTypeIds: filters.eventTypeIds
            .map(value => eventTypesByNameOrId.get(value))
            .filter((id): id is string => Boolean(id)),
    }
}

export function serializeEventFilters(filters: EventFilters, taxonomy: EventTaxonomy): string {
    const searchParams = new URLSearchParams()
    const eventTypesById = new Map<string, EventType>()

    for (const group of taxonomy.event_type_groups) {
        for (const eventType of group.event_types) {
            eventTypesById.set(eventType.id, eventType)
        }
    }

    if (filters.taxonomyGroup) {
        searchParams.set("taxonomy", filters.taxonomyGroup)
    }

    if (filters.eventTypeIds.length > 0) {
        searchParams.set(
            "type",
            filters.eventTypeIds.map(id => eventTypesById.get(id)?.name ?? id).join(","),
        )
    }

    if (filters.organizerGroupIds.length > 0) {
        searchParams.set("organizer", filters.organizerGroupIds.join(","))
    }

    return searchParams.toString()
}

export function countEventFilters(filters: EventFilters): number {
    return (
        (filters.taxonomyGroup ? 1 : 0) +
        filters.eventTypeIds.length +
        filters.organizerGroupIds.length
    )
}

export function filterEvents(events: EventDetail[], filters: EventFilters): EventDetail[] {
    const eventTypeIds = new Set(filters.eventTypeIds)
    const organizerGroupIds = new Set(filters.organizerGroupIds)

    return events.filter(event => {
        if (filters.taxonomyGroup && getTaxonomyGroupName(event) !== filters.taxonomyGroup) {
            return false
        }

        if (eventTypeIds.size > 0 && !eventTypeIds.has(event.event_type_id)) {
            return false
        }

        if (
            organizerGroupIds.size > 0 &&
            !event.organizer_groups.some(group => organizerGroupIds.has(group.id))
        ) {
            return false
        }

        return true
    })
}

export function groupEventsByTaxonomy(
    events: EventDetail[],
    taxonomy: EventTaxonomy | null,
    locale: AppLocale,
): EventSection[] {
    const groupedEvents = new Map<string, EventDetail[]>()

    for (const event of events) {
        const groupName = getTaxonomyGroupName(event)
        groupedEvents.set(groupName, [...(groupedEvents.get(groupName) ?? []), event])
    }

    const orderedGroupNames = taxonomy?.event_type_groups.map(group => group.name) ?? []
    const fallbackGroupNames = [...groupedEvents.keys()].filter(
        groupName => !orderedGroupNames.includes(groupName),
    )

    return [...orderedGroupNames, ...fallbackGroupNames]
        .map(groupName => ({
            key: groupName,
            title: getTaxonomyGroupLabel(groupName, locale),
            events: groupedEvents.get(groupName) ?? [],
        }))
        .filter(section => section.events.length > 0)
}

export function getEventDescriptionPreview(description: string | null | undefined): string {
    const text = getEventPlainTextDescription(description)

    if (text.length <= 180) {
        return text
    }

    return `${text.slice(0, 180).trimEnd()}...`
}

export function getEventPlainTextDescription(description: string | null | undefined): string {
    return (description ?? "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, " ")
        .trim()
}

export function getEventDescriptionParagraphs(description: string | null | undefined): string[] {
    return (description ?? "")
        .replace(/<\/(p|div|br|li|h[1-6])>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .split(/\n+/)
        .map(paragraph => paragraph.replace(/\s+/g, " ").trim())
        .filter(Boolean)
}

export function formatEventDate(event: EventDetail, locale: AppLocale): string {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nb-NO", {
        dateStyle: "full",
        timeZone: "Europe/Oslo",
    }).format(new Date(event.starts_at))
}

export function formatEventTime(event: EventDetail, locale: AppLocale): string {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nb-NO", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Oslo",
    }).format(new Date(event.starts_at))
}

export function formatEventTimeRange(event: EventDetail, locale: AppLocale): string {
    const dateTimeFormatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nb-NO", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Oslo",
    })
    const timeFormatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nb-NO", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Oslo",
    })

    const startsAt = new Date(event.starts_at)
    const endsAt = new Date(event.ends_at)

    return `${dateTimeFormatter.format(startsAt)} - ${timeFormatter.format(endsAt)}`
}
