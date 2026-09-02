import type { AppLocale } from "@/i18n/routing"
import { sanityClient } from "@/lib/sanity/client"
import {
  publicEventBySlugQuery,
  publicEventChildrenQuery,
  publicEventsQuery,
  publicPromotedParentEventsQuery,
  publishedEventSlugsQuery,
} from "@/lib/sanity/queries"

import {
  flattenPublicOccurrences,
  type PublicEvent,
  type PublicOccurrence,
  type RawPublicEvent,
  resolvePublicEvent,
} from "../domain/public-events"

export type PublicEventSetOptions = {
  locale: AppLocale
  from: string | null
  to: string | null
  includeInternal?: boolean
}

export type PublicEventDetailResult = {
  event: PublicEvent
  children: PublicEvent[]
}

const PUBLIC_QUERY_OPTIONS = {
  perspective: "published" as const,
  stega: false as const,
  cache: "force-cache" as const,
  next: { revalidate: 60 },
}

function resolveRows(rows: readonly RawPublicEvent[]): PublicEvent[] {
  return rows.map(resolvePublicEvent)
}

export async function fetchPublicEventSet({
  locale,
  from,
  to,
  includeInternal = false,
}: PublicEventSetOptions): Promise<{
  events: PublicEvent[]
  occurrences: PublicOccurrence[]
}> {
  const rows = await sanityClient.fetch(
    publicEventsQuery,
    {
      locale,
      from,
      to,
      includeInternal,
    },
    PUBLIC_QUERY_OPTIONS,
  )
  const events = resolveRows(rows)

  return {
    events,
    occurrences: flattenPublicOccurrences(events, { from, to }),
  }
}

export async function fetchPublicPromotedParentEvents({
  locale,
  from,
  to,
  includeInternal = false,
}: PublicEventSetOptions): Promise<PublicEvent[]> {
  const rows = await sanityClient.fetch(
    publicPromotedParentEventsQuery,
    {
      locale,
      from,
      to,
      includeInternal,
    },
    PUBLIC_QUERY_OPTIONS,
  )
  return resolveRows(rows)
}

export async function fetchPublicEventChildren(
  parentId: string,
  locale: AppLocale,
  includeInternal = false,
): Promise<PublicEvent[]> {
  const rows = await sanityClient.fetch(
    publicEventChildrenQuery,
    {
      parentId,
      locale,
      from: null,
      to: null,
      includeInternal,
    },
    PUBLIC_QUERY_OPTIONS,
  )
  return resolveRows(rows)
}

export async function fetchPublicEventBySlug(
  slug: string,
  locale: AppLocale,
  includeInternal = false,
): Promise<PublicEventDetailResult | null> {
  const row = await sanityClient.fetch(
    publicEventBySlugQuery,
    {
      slug,
      locale,
      from: null,
      to: null,
      includeInternal,
    },
    PUBLIC_QUERY_OPTIONS,
  )
  if (!row) return null

  const event = resolvePublicEvent(row)
  const isParent =
    event.eventKind === "seriesParent" || event.eventKind === "festivalParent"
  if (!isParent) return { event, children: [] }

  return {
    event,
    children: await fetchPublicEventChildren(
      event._id,
      locale,
      includeInternal,
    ),
  }
}

export async function fetchPublicEventSlugs(today: string): Promise<string[]> {
  const rows = await sanityClient.fetch(
    publishedEventSlugsQuery,
    { today },
    PUBLIC_QUERY_OPTIONS,
  )
  return (rows as readonly { slug: string | null }[]).flatMap(row =>
    row.slug ? [row.slug] : [],
  )
}
