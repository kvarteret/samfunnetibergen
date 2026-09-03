import { toPlainText } from "@portabletext/toolkit"
import { schemaOrgEventStatus } from "@samfunnet/content-domain/resolve-event"

import {
  DEFAULT_PUBLIC_VENUE_NAME,
  type PublicOccurrence,
} from "@/features/events/domain/events"

const SCHEMA_CONTEXT = "https://schema.org"
const KVARTERET_MAP_URL =
  "https://www.google.com/maps/place/Det+Akademiske+Kvarter/@60.3896713,5.3212395,19z/data=!3m1!4b1!4m6!3m5!1s0x463cfc0208521f51:0xbdfb43c9a516175!8m2!3d60.3896713!4d5.3218932!16zL20vMDNxZGJn?entry=ttu&g_ep=EgoyMDI2MDcxOS4wIKXMDSoASAFQAw%3D%3D"
const ORGANIZATION_SAME_AS = [
  "https://www.facebook.com/studentersamfunnet/",
  "https://www.instagram.com/samfunnet/",
] as const

const KVARTERET_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "Olav Kyrres gate 49",
  postalCode: "5015",
  addressLocality: "Bergen",
  addressCountry: "NO",
} as const

export type StructuredFaqSection = {
  _type?: string | null
  items?:
    | readonly {
        title?: string | null
        body?: unknown
      }[]
    | null
}

export type StructuredEventNode = {
  "@type": "Event"
  "@id": string
  name: string
  url: string
  startDate: string
  [key: string]: unknown
}

export type StructuredDataDocument = {
  "@context": typeof SCHEMA_CONTEXT
  [key: string]: unknown
}

type EventBuildOptions = {
  siteUrl: string
  locale: string
}

function normalizedSiteUrl(siteUrl: string) {
  return siteUrl.replace(/\/+$/, "")
}

export function toPlainTextContent(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined
  if (!Array.isArray(value)) return undefined

  const text = toPlainText(value as Parameters<typeof toPlainText>[0]).trim()
  return text || undefined
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  return values.find(value => typeof value === "string" && value.trim())?.trim()
}

export function buildOrganizationWebsiteGraph(
  siteUrl: string,
): StructuredDataDocument {
  const normalizedUrl = normalizedSiteUrl(siteUrl)
  const organizationId = `${normalizedUrl}#organization`
  const placeId = `${normalizedUrl}#place`

  return {
    "@context": SCHEMA_CONTEXT,
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "Samfunnet i Bergen",
        alternateName: "Studentersamfunnet i Bergen",
        url: normalizedUrl,
        sameAs: ORGANIZATION_SAME_AS,
        location: { "@id": placeId },
      },
      {
        "@type": "Place",
        "@id": placeId,
        name: "Det Akademiske Kvarter",
        alternateName: "Kvarteret",
        url: `${normalizedUrl}/nb`,
        hasMap: KVARTERET_MAP_URL,
        address: KVARTERET_ADDRESS,
      },
      {
        "@type": "WebSite",
        "@id": `${normalizedUrl}#website`,
        name: "Samfunnet i Bergen",
        url: normalizedUrl,
        publisher: { "@id": organizationId },
        inLanguage: "nb",
      },
    ],
  }
}

function eventWebsiteUrl(
  occurrence: PublicOccurrence,
  { siteUrl, locale }: EventBuildOptions,
) {
  return `${normalizedSiteUrl(siteUrl)}/${locale}/arrangementer/${encodeURIComponent(occurrence.event.slug)}`
}

function buildOffers(event: PublicOccurrence["event"]) {
  const ticketUrl = event.ticketUrl ?? undefined
  const offers: Record<string, unknown>[] = []

  if (event.isFree) {
    offers.push({
      "@type": "Offer",
      name: "Free entry",
      price: "0",
      priceCurrency: "NOK",
      availability: "https://schema.org/InStock",
      ...(ticketUrl ? { url: ticketUrl } : {}),
    })
    return offers
  }

  for (const [name, price] of [
    ["Ordinary", event.priceOrdinar],
    ["Student", event.priceStudent],
    ["Member", event.priceMedlem],
  ] as const) {
    if (typeof price !== "number" || !Number.isFinite(price)) continue
    offers.push({
      "@type": "Offer",
      name,
      price: String(price),
      priceCurrency: "NOK",
      availability: "https://schema.org/InStock",
      ...(ticketUrl ? { url: ticketUrl } : {}),
    })
  }

  if (offers.length === 0 && ticketUrl) {
    offers.push({
      "@type": "Offer",
      url: ticketUrl,
      availability: "https://schema.org/InStock",
    })
  }

  return offers
}

function buildKeywords(event: PublicOccurrence["event"]): string[] {
  return [event.eventType?.taxonomyGroup?.name, event.eventType?.name]
    .map(value => value?.trim())
    .filter((value, index, values): value is string =>
      Boolean(value && values.indexOf(value) === index),
    )
    .slice(0, 3)
}

function buildLocation(
  occurrence: PublicOccurrence,
  { siteUrl, locale }: EventBuildOptions,
) {
  const { event } = occurrence
  const roomName = firstNonEmpty(event.room?.title)
  const freeTextLocation = firstNonEmpty(event.roomText)
  if (roomName && event.room) {
    const roomUrl = event.room.slug
      ? `${normalizedSiteUrl(siteUrl)}/${locale}/rom/${encodeURIComponent(event.room.slug)}`
      : undefined
    return {
      "@type": "Place",
      name: roomName,
      ...(roomUrl ? { "@id": roomUrl, url: roomUrl } : {}),
      address: KVARTERET_ADDRESS,
      containedInPlace: { "@id": `${normalizedSiteUrl(siteUrl)}#place` },
    }
  }

  return {
    "@type": "Place",
    name: freeTextLocation ?? DEFAULT_PUBLIC_VENUE_NAME,
    address: freeTextLocation
      ? {
          "@type": "PostalAddress",
          streetAddress: freeTextLocation,
        }
      : KVARTERET_ADDRESS,
    ...(!freeTextLocation
      ? {
          "@id": `${normalizedSiteUrl(siteUrl)}#place`,
          url: `${normalizedSiteUrl(siteUrl)}/${locale}`,
        }
      : {}),
  }
}

export function buildEventStructuredDataNode(
  occurrence: PublicOccurrence,
  {
    siteUrl,
    locale,
    eventId,
  }: EventBuildOptions & {
    eventId?: string
  },
): StructuredEventNode {
  const { event, schedule } = occurrence
  const location = buildLocation(occurrence, { siteUrl, locale })

  const canonicalUrl = eventWebsiteUrl(occurrence, { siteUrl, locale })
  const occurrenceKey = encodeURIComponent(occurrence.id)
  const node: StructuredEventNode = {
    "@type": "Event",
    "@id": eventId ?? `${canonicalUrl}#${occurrenceKey}`,
    name: event.title,
    url: canonicalUrl,
    startDate: schedule.startsAt ?? schedule.startDate,
    inLanguage: locale,
  }

  if (schedule.endsAt) node.endDate = schedule.endsAt
  const description = toPlainTextContent(event.description)
  if (description) node.description = description
  if (event.imageUrl) node.image = event.imageUrl
  node.location = location

  const keywords = buildKeywords(event)
  if (keywords.length > 0) node.keywords = keywords
  node.eventAttendanceMode = "https://schema.org/OfflineEventAttendanceMode"

  const organizerName = firstNonEmpty(
    event.organizerGroup?.name,
    event.organizerText,
  )
  if (organizerName) {
    const organizerSlug = event.organizerGroup?.slug?.trim()
    const organizerUrl = organizerSlug
      ? `${normalizedSiteUrl(siteUrl)}/${locale}/grupper/${encodeURIComponent(organizerSlug)}`
      : ["samfunnet i bergen", "studentersamfunnet"].includes(
            organizerName.toLocaleLowerCase("nb-NO"),
          )
        ? normalizedSiteUrl(siteUrl)
        : undefined

    node.organizer = {
      "@type": "Organization",
      name: organizerName,
      ...(organizerUrl ? { url: organizerUrl } : {}),
    }
  }
  node.eventStatus = schemaOrgEventStatus(event.eventStatus)
  node.isAccessibleForFree = event.isFree
  const offers = buildOffers(event)
  if (offers.length > 0) node.offers = offers

  return node
}

export function buildEventStructuredData(
  occurrences: readonly PublicOccurrence[],
  options: EventBuildOptions,
): StructuredDataDocument | null {
  const nodes = occurrences.flatMap(occurrence => {
    const node = buildEventStructuredDataNode(occurrence, options)
    return [node]
  })
  if (nodes.length === 0) return null

  return {
    "@context": SCHEMA_CONTEXT,
    "@graph": nodes,
  }
}

export function buildFaqPageStructuredData(
  sections: readonly StructuredFaqSection[],
): StructuredDataDocument | null {
  const mainEntity = sections.flatMap(section => {
    if (section._type !== "infoAccordionBlock") return []

    return (section.items ?? []).flatMap(item => {
      const name = item.title?.trim()
      const text = toPlainTextContent(item.body)
      if (!name || !text) return []

      return [
        {
          "@type": "Question",
          name,
          acceptedAnswer: {
            "@type": "Answer",
            text,
          },
        },
      ]
    })
  })

  if (mainEntity.length === 0) return null

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "FAQPage",
    mainEntity,
  }
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
