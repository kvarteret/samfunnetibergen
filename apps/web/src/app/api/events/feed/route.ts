import { createClient } from "next-sanity"
import {
  resolveEffectiveStatus,
  resolveEventContent,
} from "@samfunnet/content-domain/resolve-event"
import {
  buildEventFeedData,
  serializeJsonLd,
  type StructuredEvent,
} from "@/lib/structured-data"
import { apiVersion, dataset, projectId } from "@/lib/sanity/env"
import { getOsloDateString } from "@/lib/sanity/fetch/shared"
import { feedEventsQuery } from "@/lib/sanity/queries/events"
import { resolveSiteUrl } from "@/lib/site-url"

const client = createClient({ projectId, dataset, apiVersion, useCdn: false })

export const revalidate = 300
export const dynamic = "force-static"

type RawFeedEvent = Awaited<ReturnType<typeof fetchEvents>>[number]

/** ADR 005: every feed entry is a concrete occurrence. Inheritable fields
 * fall back to the parent; the effective status combines child and parent
 * status. The non-standard `rrule` extension is gone — consumers no longer
 * expand recurrence. */
function resolveFeedEvent(raw: RawFeedEvent): StructuredEvent {
  const { parent, ...child } = raw
  return {
    ...resolveEventContent(child, parent),
    dates: raw.dates ?? [],
    eventStatus: resolveEffectiveStatus(raw.eventStatus, parent?.eventStatus),
  }
}

async function fetchEvents() {
  const today = getOsloDateString()
  return client.fetch(feedEventsQuery, { today, locale: "nb" })
}

export async function GET() {
  const today = getOsloDateString()
  const rawEvents = await fetchEvents()
  const events = rawEvents.map(resolveFeedEvent)
  const body = serializeJsonLd(
    buildEventFeedData(events, {
      siteUrl: resolveSiteUrl(),
      locale: "nb",
      today,
    }),
  )

  return new Response(body, {
    headers: {
      "Content-Type": "application/ld+json; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  })
}
