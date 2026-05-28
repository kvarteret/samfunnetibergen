import "server-only"

import type { AppLocale } from "@/i18n/routing"
import { sanityClient } from "../client"
import { sanityFetch } from "../live"
import {
    eventBySlugQuery,
    eventTypesQuery,
    eventGroupsQuery,
    eventRoomsQuery,
    eventsPageContentNbQuery,
    publishedEventsQuery,
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
        query: publishedEventsQuery,
        params: { today: getOsloDateString() },
        tags: ["events"],
    })
    return data
}

export async function fetchEventBySlug(slug: string) {
    const { data } = await sanityFetch({
        query: eventBySlugQuery,
        params: { slug, today: getOsloDateString() },
        tags: ["events"],
    })
    return data
}

export async function fetchEventRooms(): Promise<EventRoom[]> {
    return sanityClient.fetch(
        eventRoomsQuery,
        {},
        { next: { revalidate: 300, tags: ["rooms"] } },
    )
}

export async function fetchEventTypes(): Promise<EventType[]> {
    return sanityClient.fetch(
        eventTypesQuery,
        {},
        { next: { revalidate: 300, tags: ["eventTypes"] } },
    )
}

export async function fetchEventGroups(): Promise<EventGroup[]> {
    return sanityClient.fetch(
        eventGroupsQuery,
        {},
        { next: { revalidate: 300, tags: ["studentGroups"] } },
    )
}
