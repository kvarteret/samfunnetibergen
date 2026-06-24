import "server-only"

import type { ClientReturn } from "@sanity/client"
import { draftMode } from "next/headers"
import type { AppLocale } from "@/i18n/routing"
import { sanityClient } from "../client"
import { sanityFetch } from "../fetcher"
import {
  eventBySlugQuery,
  eventGroupsQuery,
  eventRoomsQuery,
  eventsPageContentNbQuery,
  eventTypesQuery,
  publishedEventSlugsQuery,
  publishedEventsQuery,
} from "../queries"
import { compact, type FetchOptions, getOsloDateString } from "./shared"

export type EventsPageContent = NonNullable<
  ClientReturn<typeof eventsPageContentNbQuery>
>

export type PublishedEvent = ClientReturn<typeof publishedEventsQuery>[number]

export type EventDetail = NonNullable<ClientReturn<typeof eventBySlugQuery>>

export type EventRoom = ClientReturn<typeof eventRoomsQuery>[number]

export type EventType = ClientReturn<typeof eventTypesQuery>[number]

export type EventGroup = ClientReturn<typeof eventGroupsQuery>[number]

export async function fetchEventsPageContent(
  _locale: AppLocale,
  options: FetchOptions = {},
): Promise<EventsPageContent | null> {
  const { data } = await sanityFetch({
    query: eventsPageContentNbQuery,
    stega: options.stega,
  })
  return data
}

export async function fetchPublishedEvents(): Promise<PublishedEvent[]> {
  const { data } = await sanityFetch({
    query: publishedEventsQuery,
    params: { today: getOsloDateString() },
  })
  return data
}

export async function fetchPublishedEventSlugs(): Promise<string[]> {
  const events = await sanityClient.fetch(
    publishedEventSlugsQuery,
    { today: getOsloDateString() },
    {
      perspective: "published",
      stega: false,
    },
  )
  return compact(events.map(event => event.slug))
}

export async function fetchEventBySlug(
  slug: string,
  options: FetchOptions = {},
): Promise<EventDetail | null> {
  const { isEnabled: preview } = await draftMode()
  const { data } = await sanityFetch({
    query: eventBySlugQuery,
    params: { preview, slug, today: getOsloDateString() },
    stega: options.stega,
  })
  return data
}

export async function fetchEventRooms(): Promise<EventRoom[]> {
  const { data } = await sanityFetch({ query: eventRoomsQuery })
  return data
}

export async function fetchEventTypes(): Promise<EventType[]> {
  const { data } = await sanityFetch({ query: eventTypesQuery })
  return data
}

export async function fetchEventGroups(): Promise<EventGroup[]> {
  const { data } = await sanityFetch({ query: eventGroupsQuery })
  return data
}
