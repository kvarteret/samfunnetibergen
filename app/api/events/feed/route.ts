import { toPlainText } from "@portabletext/toolkit"
import { TZDate } from "@date-fns/tz"
import { createClient } from "next-sanity"

import { feedArrangementsQuery } from "@/lib/sanity/queries/events"
import { apiVersion, dataset, projectId } from "@/sanity/env"

const client = createClient({ projectId, dataset, apiVersion, useCdn: false })

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://samfunnetibergen.no").trim()
const TZ = "Europe/Oslo"

export const dynamic = "force-dynamic"

type ArrangementDate = {
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

function buildEventEntry(
    arrangement: NonNullable<Awaited<ReturnType<typeof fetchArrangements>>>[number],
    date: ArrangementDate,
    index: number,
) {
    const slug = arrangement.slug
    const canonicalUrl = `${BASE_URL}/arrangementer/${slug}`
    // Disambiguate multi-date entries with date key
    const id = index === 0 ? canonicalUrl : `${canonicalUrl}#${date._key}`

    const location = arrangement.room?.title ?? arrangement.roomText ?? "Samfunnet i Bergen"
    const organizer = arrangement.organizerGroup?.name ?? arrangement.organizerText ?? "Kvarteret"

    const entry: Record<string, unknown> = {
        "@type": "Event",
        "@id": id,
        name: arrangement.title,
        url: canonicalUrl,
        startDate: toIsoUtc(date.startDate, date.startTime),
        endDate: toIsoUtc(date.startDate, date.endTime ?? date.startTime),
        eventStatus: "https://schema.org/EventScheduled",
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
        isAccessibleForFree: arrangement.isFree ?? false,
        inLanguage: "no",
        lastReviewed: arrangement._updatedAt,
    }

    if (arrangement.imageUrl) {
        entry.image = arrangement.imageUrl
    }

    if (arrangement.description?.length) {
        entry.description = toPlainText(arrangement.description)
    }

    if (arrangement.eventType?.name) {
        entry.keywords = arrangement.eventType.name
    }

    if (!arrangement.isFree) {
        const price = arrangement.priceStudent ?? arrangement.priceOrdinar
        if (price != null) {
            entry.offers = {
                "@type": "Offer",
                price: String(price),
                priceCurrency: "NOK",
                availability: "https://schema.org/InStock",
                ...(arrangement.ticketUrl ? { url: arrangement.ticketUrl } : {}),
            }
        }
    }

    return entry
}

async function fetchArrangements() {
    const today = new Date().toISOString().slice(0, 10)
    return client.fetch(feedArrangementsQuery, { today })
}

export async function GET() {
    const arrangements = await fetchArrangements()

    const events: Record<string, unknown>[] = []

    for (const arrangement of arrangements) {
        const dates = arrangement.dates ?? []

        if (arrangement.isRecurring && arrangement.rrule && dates.length > 0) {
            // Recurring events: emit base occurrence — consumers expand via rrule
            events.push(buildEventEntry(arrangement, dates[0], 0))
        } else {
            for (let i = 0; i < dates.length; i++) {
                events.push(buildEventEntry(arrangement, dates[i], i))
            }
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
