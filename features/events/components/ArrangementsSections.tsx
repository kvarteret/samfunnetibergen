"use client"

import { useArrangements } from "@/features/events/context/ArrangementsContext"
import type { PublishedArrangement } from "@/features/events/domain/arrangementUtils"
import type { AppLocale } from "@/i18n/routing"
import { type ArrangementSummary, EventCard } from "./ArrangementCard"

type PublishedArrangementDate = NonNullable<PublishedArrangement["dates"]>[number]

function toArrangementSummary(arrangement: PublishedArrangement): ArrangementSummary {
    return {
        _id: arrangement._id,
        title: arrangement.title,
        slug: arrangement.slug,
        isRecurring: arrangement.isRecurring ?? undefined,
        rrule: arrangement.rrule ?? null,
        dates: (arrangement.dates ?? []).map((d: PublishedArrangementDate) => ({
            _key: d._key,
            startDate: d.startDate,
            startTime: d.startTime ?? null,
            endTime: d.endTime ?? null,
        })),
        isFree: arrangement.isFree ?? undefined,
        priceOrdinar: arrangement.priceOrdinar ?? null,
        priceStudent: arrangement.priceStudent ?? null,
        priceMedlem: arrangement.priceMedlem ?? null,
        ticketUrl: arrangement.ticketUrl ?? null,
        facebookUrl: arrangement.facebookUrl ?? null,
        imageUrl: arrangement.imageUrl ?? null,
        imageCaption: arrangement.imageCaption ?? null,
        room: arrangement.room
            ? {
                  _id: arrangement.room._id,
                  title: arrangement.room.title,
                  slug: arrangement.room.slug,
                  floor: arrangement.room.floor ?? null,
                  imageUrl: arrangement.room.imageUrl ?? null,
              }
            : null,
        roomText: arrangement.roomText ?? null,
        organizerGroup: arrangement.organizerGroup
            ? {
                  _id: arrangement.organizerGroup._id,
                  name: arrangement.organizerGroup.name,
                  slug: arrangement.organizerGroup.slug,
              }
            : null,
        organizerText: arrangement.organizerText ?? null,
        eventType: arrangement.eventType
            ? {
                  _id: arrangement.eventType._id,
                  name: arrangement.eventType.name,
                  taxonomyGroup: arrangement.eventType.taxonomyGroup
                      ? {
                            _id: arrangement.eventType.taxonomyGroup._id,
                            name: arrangement.eventType.taxonomyGroup.name,
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
            {filteredArrangements.map(arrangement => (
                <EventCard
                    arrangement={toArrangementSummary(arrangement)}
                    facebookLabel={facebookLabel}
                    key={arrangement._id}
                    locale={locale}
                    ticketsLabel={ticketsLabel}
                />
            ))}
        </div>
    )
}
