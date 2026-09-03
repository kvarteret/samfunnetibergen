import { resolveSiteUrl } from "@/lib/site-url"

import {
  DEFAULT_PUBLIC_VENUE_NAME,
  flattenPublicOccurrences,
  type PublicEvent,
  type PublicOccurrence,
  type PublicSchedule,
} from "../domain/public-events"
import { serializePublicDescription } from "./description"
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

  return event.roomText
    ? { kind: "text", name: event.roomText }
    : { kind: "venue", name: DEFAULT_PUBLIC_VENUE_NAME }
}

function serializePricing(event: PublicEvent): PublicEventSummary["pricing"] {
  return {
    currency: "NOK",
    isFree: event.isFree,
    ordinary: event.priceOrdinar,
    student: event.priceStudent,
    member: event.priceMedlem,
  }
}

function serializePublicSchedule(
  schedule: PublicSchedule,
): PublicOccurrenceSummary["schedule"] {
  return schedule.startsAt
    ? {
        kind: "timed",
        startsAt: schedule.startsAt,
        endsAt: schedule.endsAt,
        timeZone: schedule.timeZone,
      }
    : {
        kind: "date",
        date: schedule.startDate,
        timeZone: schedule.timeZone,
      }
}

function serializePublicEventSummary(
  event: PublicEvent,
  options: PublicApiLinkOptions,
): PublicEventSummary {
  const links = {
    self: apiEventUrl(event, options),
    website: websiteEventUrl(event, options),
    ticket: event.ticketUrl,
  }

  return {
    id: event._id,
    slug: event.slug,
    kind: event.eventKind,
    status: event.eventStatus,
    updatedAt: event.effectiveUpdatedAt,
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
    pricing: serializePricing(event),
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
    description: serializePublicDescription(event.description),
    links,
  }
}

function serializePublicEventChildSummary(
  event: PublicEvent,
  options: PublicApiLinkOptions,
) {
  const { parent: ignoredParent, ...summary } = serializePublicEventSummary(
    event,
    options,
  )
  void ignoredParent
  return summary
}

export function serializePublicOccurrence(
  occurrence: PublicOccurrence,
  options: PublicApiLinkOptions,
): PublicOccurrenceSummary {
  return {
    id: occurrence.id,
    schedule: serializePublicSchedule(occurrence.schedule),
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
  const detailLinks = {
    ...summary.links,
    facebook: event.facebookUrl,
  }

  if (isParent) {
    return {
      ...summary,
      detailKind: "parent",
      links: detailLinks,
      occurrences: occurrences.map(occurrence => ({
        id: occurrence.id,
        schedule: serializePublicSchedule(occurrence.schedule),
        event: serializePublicEventChildSummary(occurrence.event, options),
      })),
    }
  }

  return {
    ...summary,
    detailKind: "leaf",
    links: detailLinks,
    occurrences: occurrences.map(occurrence => ({
      id: occurrence.id,
      schedule: serializePublicSchedule(occurrence.schedule),
    })),
  }
}
