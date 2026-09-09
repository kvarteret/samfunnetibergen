import "server-only"

import type { ClientReturn } from "@sanity/client"
import type { AppLocale } from "@/i18n/routing"
import { sanityFetch } from "../fetcher"
import { DEFAULT_LOCALE } from "../localized"
import { eventGroupsQuery, eventRoomsQuery, eventTypesQuery } from "../queries"

export type EventRoom = ClientReturn<typeof eventRoomsQuery>[number]

export type EventType = ClientReturn<typeof eventTypesQuery>[number]

export type EventGroup = ClientReturn<typeof eventGroupsQuery>[number]

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
