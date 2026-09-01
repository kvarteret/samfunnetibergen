import "server-only"

import type { ClientReturn } from "@sanity/client"
import { draftMode } from "next/headers"
import {
  type PublicEvent,
  type RawPublicEvent,
  resolvePublicEvent,
} from "@/features/events/domain/public-events"
import {
  fetchPublicEventBySlug,
  fetchPublicEventChildren,
  fetchPublicEventSet,
  fetchPublicPromotedParentEvents,
} from "@/features/events/server/public-events"
import type { AppLocale } from "@/i18n/routing"
import { sanityClient } from "../client"
import { sanityFetch } from "../fetcher"
import { DEFAULT_LOCALE } from "../localized"
import {
  eventBySlugQuery,
  eventChildrenQuery,
  eventGroupsQuery,
  eventRoomsQuery,
  eventTypesQuery,
  publishedEventSlugsQuery,
} from "../queries"
import { compact, type FetchOptions, getOsloDateString } from "./shared"

export type PublishedEvent = PublicEvent

export type EventDetail = PublicEvent
export type EventChild = PublicEvent

export type EventRoom = ClientReturn<typeof eventRoomsQuery>[number]

export type EventType = ClientReturn<typeof eventTypesQuery>[number]

export type EventGroup = ClientReturn<typeof eventGroupsQuery>[number]

export async function fetchPublishedEvents(
  locale: AppLocale = DEFAULT_LOCALE,
): Promise<PublishedEvent[]> {
  const { events } = await fetchPublicEventSet({
    locale,
    from: getOsloDateString(),
    to: null,
  })
  return events
}

export async function fetchPromotedParentEvents(
  locale: AppLocale = DEFAULT_LOCALE,
): Promise<PublishedEvent[]> {
  return fetchPublicPromotedParentEvents({
    locale,
    from: getOsloDateString(),
    to: null,
  })
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
  locale: AppLocale = DEFAULT_LOCALE,
  options: FetchOptions = {},
): Promise<EventDetail | null> {
  const { isEnabled: preview } = await draftMode()
  if (!preview) {
    const result = await fetchPublicEventBySlug(slug, locale)
    return result?.event ?? null
  }

  const { data } = await sanityFetch({
    query: eventBySlugQuery,
    params: { preview, slug, locale },
    stega: options.stega,
  })
  return data ? resolvePublicEvent(data as RawPublicEvent) : null
}

/** Approved children of a series or festival parent, in date order —
 * used by parent detail pages to render the series/festival overview. */
export async function fetchEventChildren(
  parentId: string,
  locale: AppLocale = DEFAULT_LOCALE,
  options: FetchOptions = {},
): Promise<EventChild[]> {
  const { isEnabled: preview } = await draftMode()
  if (!preview) return fetchPublicEventChildren(parentId, locale)

  const { data } = await sanityFetch({
    query: eventChildrenQuery,
    params: { parentId, locale },
    stega: options.stega,
  })
  return data.map(row => resolvePublicEvent(row as RawPublicEvent))
}

export async function fetchEventRooms(
  locale: AppLocale = DEFAULT_LOCALE,
): Promise<EventRoom[]> {
  const { data } = await sanityFetch({
    query: eventRoomsQuery,
    params: { locale },
  })
  return data
}

export async function fetchEventTypes(
  locale: AppLocale = DEFAULT_LOCALE,
): Promise<EventType[]> {
  const { data } = await sanityFetch({
    query: eventTypesQuery,
    params: { locale },
  })
  return data
}

export async function fetchEventGroups(
  locale: AppLocale = DEFAULT_LOCALE,
): Promise<EventGroup[]> {
  const { data } = await sanityFetch({
    query: eventGroupsQuery,
    params: { locale },
  })
  return data
}
