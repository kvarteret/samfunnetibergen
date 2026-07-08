import { TZDate } from "@date-fns/tz"
import { toPlainText } from "@portabletext/toolkit"
import { createClient } from "next-sanity"
import {
  resolveEffectiveStatus,
  resolveEventContent,
  schemaOrgEventStatus,
} from "@/features/events/domain/resolveEvent"
import { apiVersion, dataset, projectId } from "@/lib/sanity/env"
import { feedEventsQuery } from "@/lib/sanity/queries/events"

const client = createClient({ projectId, dataset, apiVersion, useCdn: false })

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://samfunnetibergen.no"
).trim()
const TZ = "Europe/Oslo"

export const dynamic = "force-dynamic"

type EventDate = {
  _key: string
  startDate: string
  startTime?: string | null
  endTime?: string | null
}

function toIsoUtc(date: string, time?: string | null): string {
  if (!time) {
    return `${date}T00:00:00.000Z`
  }
  return new TZDate(`${date}T${time}:00`, TZ).toISOString()
}

type RawFeedEvent = Awaited<ReturnType<typeof fetchEvents>>[number]

/** ADR 005: every feed entry is a concrete occurrence. Inheritable fields
 * fall back to the parent; the effective status combines child and parent
 * status. The non-standard `rrule` extension is gone — consumers no longer
 * expand recurrence. */
function resolveFeedEvent(raw: RawFeedEvent) {
  const { parent, ...child } = raw
  return {
    ...resolveEventContent(child, parent),
    eventStatus: resolveEffectiveStatus(raw.eventStatus, parent?.eventStatus),
  }
}

function buildEventEntry(
  arrangement: ReturnType<typeof resolveFeedEvent>,
  date: EventDate,
  index: number,
) {
  const slug = arrangement.slug
  const canonicalUrl = `${BASE_URL}/arrangementer/${slug}`
  // Disambiguate multi-date entries with date key
  const id = index === 0 ? canonicalUrl : `${canonicalUrl}#${date._key}`

  const location =
    arrangement.room?.title ?? arrangement.roomText ?? "Samfunnet i Bergen"
  const organizer =
    (arrangement.organizerGroup as { name?: string } | null)?.name ??
    (arrangement.organizerText as string | null) ??
    "Kvarteret"

  const entry: Record<string, unknown> = {
    "@type": "Event",
    "@id": id,
    name:
      (arrangement.title as string | null) ?? "[Mangler arrangementstittel]",
    url: canonicalUrl,
    startDate: toIsoUtc(date.startDate, date.startTime),
    endDate: toIsoUtc(date.startDate, date.endTime ?? date.startTime),
    eventStatus: schemaOrgEventStatus(arrangement.eventStatus),
    location: {
      "@type": "Place",
      name: location,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Bergen",
        addressCountry: "NO",
      },
    },
    organizer: {
      "@type": "Organization",
      name: organizer,
    },
    isAccessibleForFree: (arrangement.isFree as boolean | null) ?? false,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    inLanguage: "no",
    lastReviewed: arrangement._updatedAt,
  }

  // All events in this feed are approved — always true
  entry.published = true

  const imageUrl = arrangement.imageUrl as string | null
  if (imageUrl) {
    entry.image = imageUrl
  }

  const description = arrangement.description as
    | Parameters<typeof toPlainText>[0]
    | null
  if (Array.isArray(description) && description.length > 0) {
    entry.description = toPlainText(description)
  }

  const eventTypeName = (arrangement.eventType as { name?: string } | null)
    ?.name
  if (eventTypeName) {
    entry.keywords = eventTypeName
  }

  if (!arrangement.isFree) {
    const price =
      (arrangement.priceStudent as number | null) ??
      (arrangement.priceOrdinar as number | null)
    if (price != null) {
      const ticketUrl = arrangement.ticketUrl as string | null
      entry.offers = {
        "@type": "Offer",
        price: String(price),
        priceCurrency: "NOK",
        availability: "https://schema.org/InStock",
        ...(ticketUrl ? { url: ticketUrl } : {}),
      }
    }
  }

  return entry
}

async function fetchEvents() {
  const today = new Date().toISOString().slice(0, 10)
  return client.fetch(feedEventsQuery, { today })
}

export async function GET() {
  const rawEvents = await fetchEvents()

  const events: Record<string, unknown>[] = []

  for (const rawEvent of rawEvents) {
    const event = resolveFeedEvent(rawEvent)
    const dates = rawEvent.dates ?? []

    for (let i = 0; i < dates.length; i++) {
      events.push(buildEventEntry(event, dates[i], i))
    }
  }

  const body = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Arrangementer — Samfunnet i Bergen",
      url: `${BASE_URL}/arrangementer`,
      numberOfItems: events.length,
      itemListElement: events.map((event, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: event,
      })),
    },
    null,
    2,
  )

  return new Response(body, {
    headers: {
      "Content-Type": "application/ld+json; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  })
}
