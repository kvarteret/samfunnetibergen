import "server-only"

import type { AppLocale } from "@/i18n/routing"
import type { EventList, EventTaxonomy, PublicEventsResult } from "@/lib/events-utils"

export * from "@/lib/events-utils"

const DEFAULT_API_BASE_URL = "https://personal.kvarteret.no/api/v1"
const EVENTS_LIMIT = 100
const EVENTS_REVALIDATE_SECONDS = 300

const getApiClientBaseUrl = (): string => {
    const configuredBaseUrl =
        process.env.KVARTERET_PERSONAL_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL

    return configuredBaseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "")
}

const toAcceptLanguage = (locale: AppLocale): "no" | "en" => (locale === "en" ? "en" : "no")

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
    try {
        const [eventList, taxonomy] = await Promise.all([
            fetchPersonalApi<EventList>("/api/v1/events", {
                headers: {
                    "accept-language": toAcceptLanguage(locale),
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
            events: eventList.events,
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
