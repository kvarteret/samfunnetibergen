import "server-only"

import { cache } from "react"

import type { AppLocale } from "@/i18n/routing"
import type { EventDetail, EventList, EventTaxonomy, PublicEventsResult } from "@/lib/events-utils"

export * from "@/lib/events-utils"

const DEFAULT_API_BASE_URL = "https://personal.kvarteret.no/api/v1"
const EVENTS_LIMIT = 100
const EVENTS_REVALIDATE_SECONDS = 300

const getApiClientBaseUrl = (): string => {
    const configuredBaseUrl =
        process.env.KVARTERET_PERSONAL_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL

    return configuredBaseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "")
}

const toAcceptLanguage = (): "no" => "no"

type ApiQuery = Record<string, boolean | number | string | null | undefined>

const buildApiUrl = (path: string, query: ApiQuery = {}): URL => {
    const url = new URL(path, `${getApiClientBaseUrl()}/`)

    for (const [key, value] of Object.entries(query)) {
        if (value === null || value === undefined) {
            continue
        }
        url.searchParams.set(key, String(value))
    }

    return url
}

const fetchPersonalApi = async <T>(
    path: string,
    options: { headers?: HeadersInit; query?: ApiQuery } = {},
): Promise<T> => {
    const response = await fetch(buildApiUrl(path, options.query), {
        headers: options.headers,
        next: {
            revalidate: EVENTS_REVALIDATE_SECONDS,
            tags: ["kvarteret-personal-events"],
        },
    })

    if (!response.ok) {
        throw new Error(`Kvarteret Personal API request failed (${response.status}).`)
    }

    return (await response.json()) as T
}

export async function getPublicEvents(locale: AppLocale): Promise<PublicEventsResult> {
    void locale

    try {
        const [eventList, taxonomy] = await Promise.all([
            fetchPersonalApi<EventList>("/api/v1/events", {
                headers: {
                    "accept-language": toAcceptLanguage(),
                },
                query: {
                    include_internal: false,
                    limit: EVENTS_LIMIT,
                },
            }),
            fetchPersonalApi<EventTaxonomy>("/api/v1/events/taxonomy"),
        ])

        return {
            ok: true,
            events: eventList.events.filter(isCurrentOrFutureEvent),
            taxonomy,
        }
    } catch {
        return {
            ok: false,
            events: [],
            taxonomy: null,
        }
    }
}

export const getPublicEvent = cache(
    async (locale: AppLocale, eventSlugOrId: string): Promise<EventDetail | null> => {
        const result = await getPublicEvents(locale)

        if (!result.ok) {
            return null
        }

        return (
            result.events.find(
                event => event.slug === eventSlugOrId || event.id === eventSlugOrId,
            ) ?? null
        )
    },
)

function isCurrentOrFutureEvent(event: EventDetail): boolean {
    return osloDateKey(event.starts_at) >= osloDateKey(new Date())
}

function osloDateKey(value: Date | string): string {
    return new Intl.DateTimeFormat("en-CA", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "Europe/Oslo",
        year: "numeric",
    }).format(new Date(value))
}
