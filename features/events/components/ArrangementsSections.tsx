"use client"

import { useArrangements } from "@/features/events/context/ArrangementsContext"
import type { PublishedEvent } from "@/features/events/domain/eventUtils"
import type { AppLocale } from "@/i18n/routing"
import { type EventSummary, EventCard } from "./ArrangementCard"

type PublishedEventDate = NonNullable<PublishedEvent["dates"]>[number]

function toEventSummary(event: PublishedEvent): EventSummary {
    return {
        _id: event._id,
        title: event.title,
        slug: event.slug,
        isRecurring: event.isRecurring ?? undefined,
        rrule: event.rrule ?? null,
        dates: (event.dates ?? []).map((d: PublishedEventDate) => ({
            _key: d._key,
            startDate: d.startDate,
            startTime: d.startTime ?? null,
            endTime: d.endTime ?? null,
        })),
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

interface ArrangementsSectionsProps {
    emptyLabel: string
    facebookLabel: string
    locale: AppLocale
    ticketsLabel: string
}

export function ArrangementsSections({
    emptyLabel,
    facebookLabel,
    locale,
    ticketsLabel,
}: ArrangementsSectionsProps) {
    const { filteredArrangements } = useArrangements()

    if (filteredArrangements.length === 0) {
        return <p className="text-sm leading-6 text-foreground/75">{emptyLabel}</p>
    }

    return (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredArrangements.map(event => (
                <EventCard
                    event={toEventSummary(event)}
                    facebookLabel={facebookLabel}
                    key={event._id}
                    locale={locale}
                    ticketsLabel={ticketsLabel}
                />
            ))}
        </div>
    )
}
