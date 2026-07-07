import "server-only"

import type { ClientReturn } from "@sanity/client"
import { draftMode } from "next/headers"
import {
  type EventStatus,
  resolveEffectiveStatus,
  resolveEventContent,
} from "@/features/events/domain/resolveEvent"
import type { AppLocale } from "@/i18n/routing"
import { sanityClient } from "../client"
import { sanityFetch } from "../fetcher"
import {
  eventBySlugQuery,
  eventChildrenQuery,
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

type RawPublishedEvent = ClientReturn<typeof publishedEventsQuery>[number]
type RawEventDetail = NonNullable<ClientReturn<typeof eventBySlugQuery>>

const MISSING_TITLE = "[Mangler arrangementstittel]"

/** Apply ADR 005 read semantics to a query row: inheritable fields fall
 * back to the parent, the effective real-world status combines child and
 * parent status, and display defaults (title placeholder, isFree=false,
 * empty description) are applied after inheritance so a null child value
 * can inherit before defaulting. */
function resolveArrangement<T extends RawPublishedEvent | RawEventDetail>(
  row: T,
) {
  const { parent, ...child } = row
  const content = resolveEventContent(child, parent)
  return {
    ...content,
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

function resolvePublishedEvent(row: RawPublishedEvent) {
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
  options: FetchOptions = {},
): Promise<EventDetail | null> {
  const { isEnabled: preview } = await draftMode()
  const { data } = await sanityFetch({
    query: eventBySlugQuery,
    params: { preview, slug, today: getOsloDateString() },
    stega: options.stega,
  })
  return data ? resolveEventDetail(data) : null
}

/** Approved children of a series or festival parent, in date order —
 * used by parent detail pages to render the series/festival overview. */
export async function fetchEventChildren(
  parentId: string,
  options: FetchOptions = {},
): Promise<PublishedEvent[]> {
  const { data } = await sanityFetch({
    query: eventChildrenQuery,
    params: { parentId },
    stega: options.stega,
  })
  return data.map(resolvePublishedEvent)
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
