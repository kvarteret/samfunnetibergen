"use client"

import { useTranslations } from "next-intl"

import { useEvents } from "@/features/events/context/EventsContext"
import type { PublishedEvent } from "@/features/events/domain/eventUtils"
import { EventCard, type EventDateEntry, type EventSummary } from "./EventCard"

type PublishedEventDate = NonNullable<PublishedEvent["dates"]>[number]

interface EventsPageSectionsProps {
  precomputedDates: Map<
    string,
    {
      resolvedDates: EventDateEntry[]
      recurringLabel: string | null
      primaryDateLabel: string | null
    }
  >
}

function toEventSummary(
  event: PublishedEvent,
  precomputedDates: EventsPageSectionsProps["precomputedDates"],
): EventSummary {
  const dates: EventDateEntry[] = (event.dates ?? []).map(
    (d: PublishedEventDate) => ({
      _key: d._key,
      startDate: d.startDate,
      startTime: d.startTime ?? null,
      endTime: d.endTime ?? null,
    }),
  )

  const precomputed = precomputedDates.get(event._id)

  return {
    _id: event._id,
    title: event.title,
    slug: event.slug,
    isRecurring: event.isRecurring ?? undefined,
    rrule: event.rrule ?? null,
    dates,
    resolvedDates: precomputed?.resolvedDates ?? dates,
    recurringLabel: precomputed?.recurringLabel ?? null,
    primaryDateLabel: precomputed?.primaryDateLabel ?? null,
    isFree: event.isFree ?? undefined,
    priceOrdinar: event.priceOrdinar ?? null,
    priceStudent: event.priceStudent ?? null,
    priceMedlem: event.priceMedlem ?? null,
    ticketUrl: event.ticketUrl ?? null,
    facebookUrl: event.facebookUrl ?? null,
    imageUrl: event.imageUrl ?? null,
    imageCaption: event.imageCaption ?? null,
    room: event.room
      ? {
          _id: event.room._id,
          title: event.room.title,
          slug: event.room.slug,
          floor: event.room.floor ?? null,
          imageUrl: event.room.imageUrl ?? null,
        }
      : null,
    roomText: event.roomText ?? null,
    organizerGroup: event.organizerGroup
      ? {
          _id: event.organizerGroup._id,
          name: event.organizerGroup.name,
          slug: event.organizerGroup.slug,
        }
      : null,
    organizerText: event.organizerText ?? null,
    eventType: event.eventType
      ? {
          _id: event.eventType._id,
          name: event.eventType.name,
          taxonomyGroup: event.eventType.taxonomyGroup
            ? {
                _id: event.eventType.taxonomyGroup._id,
                name: event.eventType.taxonomyGroup.name,
              }
            : null,
        }
      : null,
  }
}

export function EventsPageSections({
  precomputedDates,
}: EventsPageSectionsProps) {
  const t = useTranslations("EventsPage")
  const { filteredEvents } = useEvents()

  if (filteredEvents.length === 0) {
    return <p className="text-body">{t("empty")}</p>
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {filteredEvents.map(event => (
        <EventCard
          event={toEventSummary(event, precomputedDates)}
          facebookLabel={t("facebook")}
          key={event._id}
          ticketsLabel={t("tickets")}
        />
      ))}
    </div>
  )
}
