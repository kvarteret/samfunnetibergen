import { CalendarPlus } from "lucide-react"

import { Link } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"
import type { fetchPublishedArrangements } from "@/lib/sanity/fetch"
import { type ArrangementSummary, EventCard } from "./ArrangementCard"

type PublishedArrangement = Awaited<ReturnType<typeof fetchPublishedArrangements>>[number]
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

export function EventsPage({
    arrangements,
    backLabel,
    emptyLabel,
    facebookLabel,
    locale,
    ticketsLabel,
    title,
}: {
    arrangements: PublishedArrangement[]
    backLabel: string
    emptyLabel: string
    facebookLabel: string
    locale: AppLocale
    ticketsLabel: string
    title: string
}) {
    return (
        <div className="flex flex-col gap-10">
            <header className="space-y-5">
                <Link
                    className="inline-flex text-sm uppercase tracking-[0.18em] underline underline-offset-4"
                    href="/"
                >
                    {backLabel}
                </Link>
                <h1 className="font-heading text-4xl">{title}</h1>
            </header>

            {arrangements.length === 0 ? (
                <p className="text-sm leading-6 text-foreground/75">{emptyLabel}</p>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {arrangements.map(arrangement => (
                        <EventCard
                            arrangement={toArrangementSummary(arrangement)}
                            facebookLabel={facebookLabel}
                            key={arrangement._id}
                            locale={locale}
                            ticketsLabel={ticketsLabel}
                        />
                    ))}
                </div>
            )}

            <div className="flex flex-col gap-4 border-2 border-border bg-card p-5 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex size-10 shrink-0 items-center justify-center bg-primary">
                    <CalendarPlus className="size-5 text-primary-foreground" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-heading text-sm leading-snug text-foreground">
                        Arrangerer du eller din organisasjon noe på Samfunnet?
                    </p>
                    <p className="mt-0.5 text-sm text-foreground/60">
                        Legg til arrangementet i listen — det gjennomgås av PR-gruppen og publiseres
                        innen 1–3 virkedager.
                    </p>
                </div>
                <Link
                    className="btn-brutal inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-2 border-border bg-primary px-4 py-2.5 font-heading text-sm text-primary-foreground"
                    href="/arrangementer/ny"
                >
                    Legg til i listen
                </Link>
            </div>
        </div>
    )
}
