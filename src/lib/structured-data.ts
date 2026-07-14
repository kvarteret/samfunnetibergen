import { TZDate } from "@date-fns/tz"
import { toPlainText } from "@portabletext/toolkit"
import {
  type EventStatus,
  schemaOrgEventStatus,
} from "@/features/events/domain/resolveEvent"

const OSLO_TIME_ZONE = "Europe/Oslo"
const SCHEMA_CONTEXT = "https://schema.org"
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^\d{2}:\d{2}(:\d{2})?$/

export type StructuredEventDate = {
  _key?: string | null
  startDate: string
  startTime?: string | null
  endTime?: string | null
}

export type StructuredEvent = {
  slug: string
  title?: string | null
  dates: readonly StructuredEventDate[]
  description?: unknown
  imageUrl?: string | null
  organizerGroup?: { name?: string | null } | null
  organizerText?: string | null
  room?: { title?: string | null } | null
  roomText?: string | null
  eventStatus?: EventStatus | null
  isFree?: boolean | null
  priceOrdinar?: number | null
  priceStudent?: number | null
  priceMedlem?: number | null
  ticketUrl?: string | null
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

type EventOccurrenceOptions = EventBuildOptions & {
  today: string
}

function normalizedSiteUrl(siteUrl: string) {
  return siteUrl.replace(/\/+$/, "")
}

function toOsloTimestamp(date: string, time: string) {
  if (!TIME_PATTERN.test(time)) return null
  const normalizedTime = time.length === 5 ? `${time}:00` : time
  return new TZDate(`${date}T${normalizedTime}`, OSLO_TIME_ZONE).toISOString()
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

  return {
    "@context": SCHEMA_CONTEXT,
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "Samfunnet i Bergen",
        url: normalizedUrl,
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

export function buildEventStructuredDataNode(
  event: StructuredEvent,
  date: StructuredEventDate,
  { siteUrl, locale }: EventBuildOptions,
): StructuredEventNode | null {
  if (!DATE_PATTERN.test(date.startDate)) return null

  const baseUrl = normalizedSiteUrl(siteUrl)
  const canonicalUrl = `${baseUrl}/${locale}/arrangementer/${encodeURIComponent(event.slug)}`
  const occurrenceKey = encodeURIComponent(date._key || date.startDate)
  const startDate = date.startTime
    ? toOsloTimestamp(date.startDate, date.startTime)
    : date.startDate
  if (!startDate) return null

  const endDate = date.endTime
    ? toOsloTimestamp(date.startDate, date.endTime)
    : null
  const name = event.title?.trim() || "[Mangler arrangementstittel]"
  const locationName = firstNonEmpty(event.room?.title, event.roomText)
  const organizerName = firstNonEmpty(
    event.organizerGroup?.name,
    event.organizerText,
  )
  const description = toPlainTextContent(event.description)
  const imageUrl = event.imageUrl?.trim()
  const ticketUrl = event.ticketUrl?.trim()
  const price = [
    event.priceStudent,
    event.priceOrdinar,
    event.priceMedlem,
  ].find(value => typeof value === "number" && Number.isFinite(value))

  const node: StructuredEventNode = {
    "@type": "Event",
    "@id": `${canonicalUrl}#${occurrenceKey}`,
    name,
    url: canonicalUrl,
    startDate,
    inLanguage: "nb",
  }

  if (endDate) node.endDate = endDate
  if (description) node.description = description
  if (imageUrl) node.image = imageUrl
  if (locationName) {
    node.location = { "@type": "Place", name: locationName }
    node.eventAttendanceMode = "https://schema.org/OfflineEventAttendanceMode"
  }
  if (organizerName) {
    node.organizer = { "@type": "Organization", name: organizerName }
  }
  if (event.eventStatus) {
    node.eventStatus = schemaOrgEventStatus(event.eventStatus)
  }
  if (typeof event.isFree === "boolean") {
    node.isAccessibleForFree = event.isFree
  }
  if (event.isFree !== true && (price != null || ticketUrl)) {
    node.offers = {
      "@type": "Offer",
      ...(price != null ? { price: String(price), priceCurrency: "NOK" } : {}),
      ...(ticketUrl ? { url: ticketUrl } : {}),
      availability: "https://schema.org/InStock",
    }
  }

  return node
}

function buildOccurrenceNodes(
  event: StructuredEvent,
  { siteUrl, locale, today }: EventOccurrenceOptions,
): StructuredEventNode[] {
  return event.dates.flatMap(date => {
    if (date.startDate < today) return []
    const node = buildEventStructuredDataNode(event, date, { siteUrl, locale })
    return node ? [node] : []
  })
}

export function buildEventStructuredData(
  event: StructuredEvent,
  options: EventOccurrenceOptions,
): StructuredDataDocument | null {
  const nodes = buildOccurrenceNodes(event, options)

  if (nodes.length === 0) return null

  return {
    "@context": SCHEMA_CONTEXT,
    "@graph": nodes,
  }
}

export function buildEventFeedData(
  events: readonly StructuredEvent[],
  options: EventOccurrenceOptions,
): StructuredDataDocument {
  const items = events.flatMap(event => buildOccurrenceNodes(event, options))
  const feedUrl = `${normalizedSiteUrl(options.siteUrl)}/${options.locale}/arrangementer`

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "ItemList",
    name: "Arrangementer — Samfunnet i Bergen",
    url: feedUrl,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item,
    })),
  }
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
