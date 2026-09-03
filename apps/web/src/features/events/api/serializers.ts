import { resolveSiteUrl } from "@/lib/site-url"

import {
  DEFAULT_PUBLIC_VENUE_NAME,
  type PublicEvent,
  type PublicOccurrence,
  type PublicSchedule,
} from "../domain/events"
import { serializePublicDescription } from "./description"
import type { PublicApiEvent, PublicApiOccurrence } from "./schemas"

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

function serializeImage(event: PublicEvent) {
  return event.imageUrl
    ? { url: event.imageUrl, caption: event.imageCaption }
    : null
}

function serializeOrganizer(event: PublicEvent): PublicApiEvent["organizer"] {
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

function serializeLocation(event: PublicEvent): PublicApiEvent["location"] {
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

function serializePricing(event: PublicEvent): PublicApiEvent["pricing"] {
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
): PublicApiOccurrence["schedule"] {
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

function serializePublicEvent(
  event: PublicEvent,
  options: PublicApiLinkOptions,
): PublicApiEvent {
  const siteUrl = normalizedSiteUrl(options.siteUrl ?? resolveSiteUrl())

  return {
    id: event._id,
    slug: event.slug,
    kind: event.eventKind,
    status: event.eventStatus,
    updatedAt: event.effectiveUpdatedAt,
    title: event.title,
    description: serializePublicDescription(event.description),
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
          website: `${siteUrl}/${options.locale}/arrangementer/${encodeURIComponent(event.parentEvent.slug)}`,
        }
      : null,
    links: {
      website: websiteEventUrl(event, options),
      ticket: event.ticketUrl,
      facebook: event.facebookUrl,
    },
  }
}

/** Serialize one occurrence with the complete public event fields. */
export function serializePublicOccurrence(
  occurrence: PublicOccurrence,
  options: PublicApiLinkOptions,
): PublicApiOccurrence {
  return {
    id: occurrence.id,
    schedule: serializePublicSchedule(occurrence.schedule),
    event: serializePublicEvent(occurrence.event, options),
  }
}
