import { TZDate } from "@date-fns/tz"
import { toPlainText } from "@portabletext/toolkit"
import {
  schemaOrgEventStatus,
  type EventStatus,
} from "@/features/events/domain/resolveEvent"

const OSLO_TIME_ZONE = "Europe/Oslo"
const SCHEMA_CONTEXT = "https://schema.org"
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^(\d{2}):(\d{2})(?::(\d{2}))?$/
const EVENT_STATUSES = new Set<EventStatus>([
  "scheduled",
  "cancelled",
  "postponed",
])

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

type EventDocumentOptions = EventBuildOptions & {
  today?: string
}

type EventFeedOptions = EventBuildOptions & {
  today?: string
}

function normalizedSiteUrl(siteUrl: string) {
  return siteUrl.replace(/\/+$/, "")
}

function isValidDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false

  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

function isValidTime(value: string) {
  const match = value.match(TIME_PATTERN)
  if (!match) return false

  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3] ?? "0")
  return hours < 24 && minutes < 60 && seconds < 60
}

function toOsloTimestamp(date: string, time: string) {
  if (!isValidDate(date) || !isValidTime(time)) return null
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
  if (!isValidDate(date.startDate)) return null

  const baseUrl = normalizedSiteUrl(siteUrl)
  const canonicalUrl = `${baseUrl}/${locale}/arrangementer/${encodeURIComponent(event.slug)}`
  const occurrenceKey = encodeURIComponent(date._key?.trim() || date.startDate)
  const startDate = date.startTime?.trim()
    ? toOsloTimestamp(date.startDate, date.startTime.trim())
    : date.startDate
  if (!startDate) return null

  const endDate = date.endTime?.trim()
    ? toOsloTimestamp(date.startDate, date.endTime.trim())
    : null
  const name = event.title?.trim() || "[Mangler arrangementstittel]"
  const locationName = firstNonEmpty(event.room?.title, event.roomText)
  const organizerName = firstNonEmpty(
    event.organizerGroup?.name,
    event.organizerText,
  )
  const description = toPlainTextContent(event.description)
  const imageUrl = firstNonEmpty(event.imageUrl)
  const ticketUrl = firstNonEmpty(event.ticketUrl)
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
  if (event.eventStatus && EVENT_STATUSES.has(event.eventStatus)) {
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

function osloDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: OSLO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export function buildEventStructuredData(
  event: StructuredEvent,
  { siteUrl, locale, today = osloDateString() }: EventDocumentOptions,
): StructuredDataDocument | null {
  const nodes = event.dates.flatMap(date => {
    if (date.startDate < today) return []
    const node = buildEventStructuredDataNode(event, date, { siteUrl, locale })
    return node ? [node] : []
  })

  if (nodes.length === 0) return null

  return {
    "@context": SCHEMA_CONTEXT,
    "@graph": nodes,
  }
}

export function buildEventFeedData(
  events: readonly StructuredEvent[],
  { siteUrl, locale, today = osloDateString() }: EventFeedOptions,
): StructuredDataDocument {
  const items = events.flatMap(event =>
    event.dates.flatMap(date => {
      if (date.startDate < today) return []
      const node = buildEventStructuredDataNode(event, date, {
        siteUrl,
        locale,
      })
      return node ? [node] : []
    }),
  )
  const feedUrl = `${normalizedSiteUrl(siteUrl)}/${locale}/arrangementer`

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
  return (JSON.stringify(data) ?? "null").replace(/</g, "\\u003c")
}
