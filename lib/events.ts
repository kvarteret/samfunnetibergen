import "server-only"

import type { AppLocale } from "@/i18n/routing"
import {
    getEventTaxonomy,
    listEvents,
    type EventDetail,
    type EventTaxonomy,
} from "@/lib/kvarteret-personal-api"
import { client } from "@/lib/kvarteret-personal-api/client.gen"

const DEFAULT_API_BASE_URL = "https://personal.kvarteret.no/api/v1"
const EVENTS_LIMIT = 100
const FALLBACK_TAXONOMY_GROUP = "Annet"

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

const getApiClientBaseUrl = (): string => {
    const configuredBaseUrl =
        process.env.KVARTERET_PERSONAL_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL

    return configuredBaseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "")
}

const toAcceptLanguage = (locale: AppLocale): "no" | "en" => (locale === "en" ? "en" : "no")

const configureClient = (): void => {
    client.setConfig({
        baseUrl: getApiClientBaseUrl(),
    })
}

const unwrapApiResponse = <T>(result: { data?: T; error?: unknown; response: Response }): T => {
    if (!result.response.ok || result.error || !result.data) {
        throw new Error(`Kvarteret Personal API request failed (${result.response.status}).`)
    }

    return result.data
}

export async function getPublicEvents(locale: AppLocale): Promise<PublicEventsResult> {
    configureClient()

    try {
        const [eventsResult, taxonomyResult] = await Promise.all([
            listEvents({
                headers: {
                    "accept-language": toAcceptLanguage(locale),
                },
                query: {
                    include_internal: false,
                    limit: EVENTS_LIMIT,
                },
            }),
            getEventTaxonomy(),
        ])

        return {
            ok: true,
            events: unwrapApiResponse(eventsResult).events,
            taxonomy: unwrapApiResponse(taxonomyResult),
        }
    } catch {
        return {
            ok: false,
            events: [],
            taxonomy: null,
        }
    }
}

const getTaxonomyGroupName = (event: EventDetail): string =>
    event.event_type?.taxonomy_group?.trim() || FALLBACK_TAXONOMY_GROUP

const getTaxonomyGroupLabel = (groupName: string, locale: AppLocale): string =>
    TAXONOMY_GROUP_LABELS[groupName]?.[locale] ?? groupName

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
    const text = (description ?? "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, " ")
        .trim()

    if (text.length <= 180) {
        return text
    }

    return `${text.slice(0, 180).trimEnd()}...`
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
