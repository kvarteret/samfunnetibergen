import "server-only"

import type { AppLocale } from "@/i18n/routing"
import { sanityClient } from "../client"
import { sanityFetch } from "../live"
import {
    arrangementBySlugQuery,
    arrangementEventTypesQuery,
    arrangementGroupsQuery,
    arrangementRoomsQuery,
    eventsPageContentNbQuery,
    publishedArrangementsQuery,
} from "../queries"
import { type FetchOptions, getOsloDateString } from "./shared"

export type EventRoom = { _id: string; title: string; slug: string }
export type EventType = {
    _id: string
    name: string
    slug: string
    taxonomyGroup: { _id: string; name: string; slug: string } | null
}
export type EventGroup = { _id: string; name: string; category: string }

export async function fetchEventsPageContent(_locale: AppLocale, options: FetchOptions = {}) {
    const { data } = await sanityFetch({
        query: eventsPageContentNbQuery,
        tags: ["eventsPage"],
        stega: options.stega,
    })
    return data
}

export async function fetchPublishedEvents() {
    const { data } = await sanityFetch({
        query: publishedArrangementsQuery,
        params: { today: getOsloDateString() },
        tags: ["arrangements"],
    })
    return data
}

export async function fetchEventBySlug(slug: string) {
    const { data } = await sanityFetch({
        query: arrangementBySlugQuery,
        params: { slug, today: getOsloDateString() },
        tags: ["arrangements"],
    })
    return data
}

export async function fetchEventRooms(): Promise<EventRoom[]> {
    return sanityClient.fetch(
        arrangementRoomsQuery,
        {},
        { next: { revalidate: 300, tags: ["rooms"] } },
    )
}

export async function fetchEventTypes(): Promise<EventType[]> {
    return sanityClient.fetch(
        arrangementEventTypesQuery,
        {},
        { next: { revalidate: 300, tags: ["eventTypes"] } },
    )
}

export async function fetchEventGroups(): Promise<EventGroup[]> {
    return sanityClient.fetch(
        arrangementGroupsQuery,
        {},
        { next: { revalidate: 300, tags: ["studentGroups"] } },
    )
}
