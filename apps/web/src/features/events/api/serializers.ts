import { resolveSiteUrl } from "@/lib/site-url"
import { toPlainTextContent } from "@/lib/structured-data"

import {
  flattenPublicOccurrences,
  type PublicEvent,
  type PublicOccurrence,
} from "../domain/public-events"
import type {
  PublicEventDetail,
  PublicEventSummary,
  PublicOccurrenceSummary,
} from "./schemas"

export type PublicApiLinkOptions = {
  siteUrl?: string
  locale: "nb" | "en"
}

function normalizedSiteUrl(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, "")
}

function websiteEventUrl(event: PublicEvent, options: PublicApiLinkOptions) {
  return `${normalizedSiteUrl(options.siteUrl ?? resolveSiteUrl())}/${options.locale}/arrangementer/${encodeURIComponent(event.slug)}`
}

function apiEventUrl(event: PublicEvent, options: PublicApiLinkOptions) {
  return `${normalizedSiteUrl(options.siteUrl ?? resolveSiteUrl())}/api/v1/events/${encodeURIComponent(event.slug)}?locale=${options.locale}`
}

function serializeImage(event: PublicEvent) {
  return event.imageUrl
    ? { url: event.imageUrl, caption: event.imageCaption }
    : null
}

function serializeOrganizer(
  event: PublicEvent,
): PublicEventSummary["organizer"] {
  if (event.organizerGroup) {
    return {
      kind: "group",
      id: event.organizerGroup._id,
      name: event.organizerGroup.name,
      slug: event.organizerGroup.slug,
    }
  }

  return event.organizerText
    ? { kind: "text", name: event.organizerText }
    : null
}

function serializeLocation(event: PublicEvent): PublicEventSummary["location"] {
  if (event.room) {
    return {
      kind: "room",
      id: event.room._id,
      name: event.room.title,
      slug: event.room.slug,
      floor: event.room.floor,
      imageUrl: event.room.imageUrl,
    }
  }

  return event.roomText ? { kind: "text", name: event.roomText } : null
}

function serializePublicEventSummary(
  event: PublicEvent,
  options: PublicApiLinkOptions,
): PublicEventSummary {
  const links = {
    self: apiEventUrl(event, options),
    website: websiteEventUrl(event, options),
  }

  return {
    id: event._id,
    slug: event.slug,
    kind: event.eventKind,
    status: event.eventStatus,
    title: event.title,
    image: serializeImage(event),
    eventType: event.eventType
      ? { id: event.eventType._id, name: event.eventType.name }
      : null,
    taxonomyGroup: event.eventType?.taxonomyGroup
      ? {
          id: event.eventType.taxonomyGroup._id,
          name: event.eventType.taxonomyGroup.name,
        }
      : null,
    organizer: serializeOrganizer(event),
    location: serializeLocation(event),
    parent: event.parentEvent
      ? {
          id: event.parentEvent._id,
          slug: event.parentEvent.slug,
          kind: event.parentEvent.eventKind,
          status: event.parentEvent.eventStatus,
          title: event.parentEvent.title,
          links: {
            self: `${normalizedSiteUrl(options.siteUrl ?? resolveSiteUrl())}/api/v1/events/${encodeURIComponent(event.parentEvent.slug)}?locale=${options.locale}`,
            website: `${normalizedSiteUrl(options.siteUrl ?? resolveSiteUrl())}/${options.locale}/arrangementer/${encodeURIComponent(event.parentEvent.slug)}`,
          },
        }
      : null,
    links,
  }
}

export function serializePublicOccurrence(
  occurrence: PublicOccurrence,
  options: PublicApiLinkOptions,
): PublicOccurrenceSummary {
  return {
    id: occurrence.id,
    schedule: occurrence.schedule,
    event: serializePublicEventSummary(occurrence.event, options),
  }
}

export function serializePublicEventDetail(
  event: PublicEvent,
  children: readonly PublicEvent[],
  options: PublicApiLinkOptions,
): PublicEventDetail {
  const isParent =
    event.eventKind === "seriesParent" || event.eventKind === "festivalParent"
  const occurrences = isParent
    ? flattenPublicOccurrences(children)
    : flattenPublicOccurrences([event])
  const summary = serializePublicEventSummary(event, options)

  return {
    ...summary,
    description: {
      blocks: [...event.description],
      text: toPlainTextContent(event.description) ?? "",
    },
    pricing: {
      currency: "NOK",
      isFree: event.isFree,
      ordinary: event.priceOrdinar,
      student: event.priceStudent,
      member: event.priceMedlem,
    },
    links: {
      ...summary.links,
      ticket: event.ticketUrl,
      facebook: event.facebookUrl,
    },
    occurrences: occurrences.map(occurrence =>
      serializePublicOccurrence(occurrence, options),
    ),
  }
}
