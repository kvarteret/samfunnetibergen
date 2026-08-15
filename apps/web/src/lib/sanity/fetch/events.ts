import "server-only"

import type { ClientReturn } from "@sanity/client"
import { draftMode } from "next/headers"
import type { AppLocale } from "@/i18n/routing"
import {
  type EventStatus,
  resolveEffectiveStatus,
  resolveEventContent,
} from "@samfunnet/content-domain/resolve-event"
import { sanityClient } from "../client"
import { sanityFetch } from "../fetcher"
import {
  eventBySlugQuery,
  eventChildrenQuery,
  eventGroupsQuery,
  eventRoomsQuery,
  eventTypesQuery,
  promotedParentEventsQuery,
  publishedEventSlugsQuery,
  publishedEventsQuery,
} from "../queries"
import { compact, type FetchOptions, getOsloDateString } from "./shared"
import { DEFAULT_LOCALE } from "../localized"

type RawPublishedEvent = ClientReturn<typeof publishedEventsQuery>[number]
type RawPromotedParentEvent = ClientReturn<
  typeof promotedParentEventsQuery
>[number]
type RawEventDetail = NonNullable<ClientReturn<typeof eventBySlugQuery>>

const MISSING_TITLE = "[Mangler arrangementstittel]"

/** Apply ADR 005 read semantics to a query row: inheritable fields fall
 * back to the parent, the effective real-world status combines child and
 * parent status, and display defaults (title placeholder, isFree=false,
 * empty description) are applied after inheritance so a null child value
 * can inherit before defaulting. */
function resolveArrangement<
  T extends RawPublishedEvent | RawPromotedParentEvent | RawEventDetail,
>(row: T) {
  const { parent, ...child } = row
  const inheritFestivalImage =
    row.eventKind !== "festivalSession" || row.useFestivalImage !== false
  const effectiveParent =
    parent && !inheritFestivalImage
      ? { ...parent, imageUrl: null, imageCaption: null }
      : parent
  const content = resolveEventContent(child, effectiveParent)
  const dates: Array<{
    _key: string
    startDate: string
    startTime: string | null
    endTime: string | null
  }> = (content.dates ?? []).flatMap(date =>
    date
      ? [
          {
            _key: date._key,
            startDate: date.startDate,
            startTime: date.startTime,
            endTime: date.endTime,
          },
        ]
      : [],
  )
  return {
    ...content,
    dates,
    title: (content.title ?? MISSING_TITLE) as string,
    isFree: (content.isFree ?? false) as boolean,
    description: (content.description ?? []) as NonNullable<T["description"]>,
    eventStatus: resolveEffectiveStatus(
      row.eventStatus as EventStatus | null,
      parent?.eventStatus as EventStatus | null,
    ),
    parentEvent: parent
      ? { _id: parent._id, slug: parent.slug, title: parent.title }
      : null,
  }
}

function resolvePublishedEvent(
  row: RawPublishedEvent | RawPromotedParentEvent,
) {
  return resolveArrangement(row)
}

function resolveEventDetail(row: RawEventDetail) {
  return resolveArrangement(row)
}

export type PublishedEvent = ReturnType<typeof resolvePublishedEvent>

export type EventDetail = ReturnType<typeof resolveEventDetail>

export type EventRoom = ClientReturn<typeof eventRoomsQuery>[number]

export type EventType = ClientReturn<typeof eventTypesQuery>[number]

export type EventGroup = ClientReturn<typeof eventGroupsQuery>[number]

export async function fetchPublishedEvents(
  locale: AppLocale = DEFAULT_LOCALE,
): Promise<PublishedEvent[]> {
  const { data } = await sanityFetch({
    query: publishedEventsQuery,
    params: { locale, today: getOsloDateString() },
  })
  return data.map(resolvePublishedEvent)
}

export async function fetchPromotedParentEvents(
  locale: AppLocale = DEFAULT_LOCALE,
): Promise<PublishedEvent[]> {
  const { data } = await sanityFetch({
    query: promotedParentEventsQuery,
    params: { locale, today: getOsloDateString() },
  })
  return data.map(resolvePublishedEvent)
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
  const { data } = await sanityFetch({
    query: eventBySlugQuery,
    params: { preview, slug, locale },
    stega: options.stega,
  })
  return data ? resolveEventDetail(data) : null
}

/** Approved children of a series or festival parent, in date order —
 * used by parent detail pages to render the series/festival overview. */
export async function fetchEventChildren(
  parentId: string,
  locale: AppLocale = DEFAULT_LOCALE,
  options: FetchOptions = {},
): Promise<PublishedEvent[]> {
  const { data } = await sanityFetch({
    query: eventChildrenQuery,
    params: { parentId, locale },
    stega: options.stega,
  })
  return data.map(resolvePublishedEvent)
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
