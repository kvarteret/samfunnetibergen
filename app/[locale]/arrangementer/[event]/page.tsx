/* eslint-disable @next/next/no-img-element */
import { ExternalLink, Ticket } from "lucide-react"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"
import { activateRequestLocale, resolvePageLocale } from "@/lib/app-locale"
import {
    type EventDetail,
    formatEventDate,
    formatEventTime,
    getEventDescriptionParagraphs,
    getEventPlainTextDescription,
    getPublicEvent,
} from "@/lib/events"

const getRoomName = (event: EventDetail): string | null =>
    event.room?.name ?? event.room_text ?? null

const getOrganizerLabel = (event: EventDetail): string | null => {
    const organizers = event.organizer_groups.map(group => group.name).filter(Boolean)
    return organizers.length > 0 ? organizers.join(", ") : null
}

const getTaxonomyLabel = (event: EventDetail): string | null =>
    event.event_type?.name ?? event.event_type?.taxonomy_group ?? null

const getEventFilterHref = (event: EventDetail): string | null => {
    if (event.event_type?.name) {
        return `/arrangementer?type=${encodeURIComponent(event.event_type.name)}`
    }

    if (event.event_type?.taxonomy_group) {
        return `/arrangementer?taxonomy=${encodeURIComponent(event.event_type.taxonomy_group)}`
    }

    return null
}

const formatPrice = (price: string | null | undefined): string =>
    (price ?? "").replace(/:\s*/g, ": ").trim()

const getPriceLines = (price: string | null | undefined): string[] =>
    formatPrice(price)
        .split(/\n+/)
        .map(line => line.trim())
        .filter(Boolean)

type EventPageProps = {
    params: Promise<{
        event: string
        locale: string
    }>
}

type EventScheduleRow = {
    date: string
    place: string
    time: string
}

const getScheduleRows = (event: EventDetail, locale: AppLocale): EventScheduleRow[] => [
    {
        date: formatEventDate(event, locale),
        place: getRoomName(event) || "-",
        time: formatEventTime(event, locale),
    },
]

export async function generateMetadata({ params }: EventPageProps) {
    const resolvedParams = await params
    const locale = await resolvePageLocale(Promise.resolve({ locale: resolvedParams.locale }))
    const event = await getPublicEvent(locale, resolvedParams.event)

    if (!event) {
        return {}
    }

    const description = getEventPlainTextDescription(event.description)

    return {
        title: `${event.title} | Samfunnet i Bergen`,
        description: description || undefined,
        openGraph: {
            title: event.title,
            description: description || undefined,
            images: event.image_url ? [{ url: event.image_url }] : undefined,
        },
    }
}

function EventHero({ event, ticketLabel }: { event: EventDetail; ticketLabel: string }) {
    const taxonomy = getTaxonomyLabel(event)
    const eventFilterHref = getEventFilterHref(event)

    return (
        <header className="grid gap-6 lg:grid-cols-[clamp(19rem,20%,23rem)_minmax(0,1fr)]">
            <div className="flex h-full flex-col justify-evenly">
                {taxonomy && eventFilterHref ? (
                    <Link
                        className="w-fit bg-primary px-3 py-1.5 text-sm font-heading text-primary-foreground hover:underline hover:underline-offset-4"
                        href={eventFilterHref}
                    >
                        {taxonomy}
                    </Link>
                ) : taxonomy ? (
                    <p className="w-fit bg-primary px-3 py-1.5 text-sm font-heading text-primary-foreground">
                        {taxonomy}
                    </p>
                ) : null}
                <h1 className="wrap-break-word font-heading text-4xl leading-none text-foreground">
                    {event.title}
                </h1>
                {event.ticket_url ? (
                    <Button asChild className="w-fit" size="default">
                        <a href={event.ticket_url} rel="noreferrer" target="_blank">
                            <Ticket aria-hidden="true" />
                            {ticketLabel}
                        </a>
                    </Button>
                ) : null}
            </div>

            <div className="border-2 border-border bg-muted shadow-shadow">
                {event.image_url ? (
                    <img
                        alt={event.image_caption || event.title}
                        className="aspect-[16/10] max-h-[28rem] w-full object-cover lg:aspect-[16/9]"
                        src={event.image_url}
                    />
                ) : (
                    <div className="flex aspect-[16/10] max-h-[28rem] items-center justify-center p-8 text-center lg:aspect-[16/9]">
                        <p className="max-w-md font-heading text-4xl leading-tight text-foreground/50">
                            {event.title}
                        </p>
                    </div>
                )}
            </div>
        </header>
    )
}

function EventSchedule({
    dateLabel,
    event,
    locale,
    placeLabel,
    timeLabel,
}: {
    dateLabel: string
    event: EventDetail
    locale: AppLocale
    placeLabel: string
    timeLabel: string
}) {
    const rows = getScheduleRows(event, locale)

    return (
        <section>
            <div className="grid grid-cols-[1.3fr_0.6fr_1fr] gap-3 px-0 py-3 font-heading text-xs uppercase tracking-[0.18em] text-foreground sm:gap-4 sm:text-sm">
                <p>{dateLabel}</p>
                <p>{timeLabel}</p>
                <p>{placeLabel}</p>
            </div>
            {rows.map((row, index) => (
                <div
                    className="grid grid-cols-[1.3fr_0.6fr_1fr] gap-3 px-0 py-4 text-lg leading-tight text-foreground sm:gap-4 sm:text-xl"
                    key={`${row.date}-${row.time}-${row.place}-${index}`}
                >
                    <p>{row.date}</p>
                    <p>{row.time}</p>
                    <p>{row.place}</p>
                </div>
            ))}
        </section>
    )
}

function EventMeta({
    event,
    organizerLabel,
    priceLabel,
}: {
    event: EventDetail
    organizerLabel: string
    priceLabel: string
}) {
    const organizer = getOrganizerLabel(event)
    const priceLines = getPriceLines(event.price)

    return (
        <aside className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-3">
                <p className="font-heading text-sm uppercase tracking-[0.18em] text-foreground">
                    {priceLabel}
                </p>
                {priceLines.length > 0 ? (
                    <div className="space-y-1 text-lg leading-6 text-foreground">
                        {priceLines.map(line => (
                            <p key={line}>{line}</p>
                        ))}
                    </div>
                ) : (
                    <p className="text-lg leading-6 text-foreground">-</p>
                )}
            </div>
            {organizer ? (
                <div className="space-y-3">
                    <p className="font-heading text-sm uppercase tracking-[0.18em] text-foreground">
                        {organizerLabel}
                    </p>
                    <p className="text-lg leading-6 text-foreground">{organizer}</p>
                </div>
            ) : null}
        </aside>
    )
}

function EventDescription({ event, facebookLabel }: { event: EventDetail; facebookLabel: string }) {
    const paragraphs = getEventDescriptionParagraphs(event.description)

    return (
        <section className="grid gap-6 lg:grid-cols-[clamp(19rem,20%,23rem)_minmax(0,1fr)]">
            <div className="space-y-4">
                {event.facebook_url ? (
                    <Button asChild variant="neutral">
                        <a href={event.facebook_url} rel="noreferrer" target="_blank">
                            <ExternalLink aria-hidden="true" />
                            {facebookLabel}
                        </a>
                    </Button>
                ) : null}
            </div>
            <div className="space-y-5 border-l-2 border-foreground/60 pl-6 text-lg leading-8 text-foreground/85 max-lg:border-l-0 max-lg:pl-0">
                {paragraphs.length > 0 ? (
                    paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)
                ) : (
                    <p>-</p>
                )}
            </div>
        </section>
    )
}

export default async function EventPage({ params }: EventPageProps) {
    const resolvedParams = await params
    const locale = (await resolvePageLocale(
        Promise.resolve({ locale: resolvedParams.locale }),
    )) as AppLocale
    activateRequestLocale(locale)

    const [event, t] = await Promise.all([
        getPublicEvent(locale, resolvedParams.event),
        getTranslations({ locale, namespace: "EventPage" }),
    ])

    if (!event) {
        notFound()
    }

    return (
        <article className="flex w-full flex-col gap-8">
            <EventHero event={event} ticketLabel={t("tickets")} />
            <div className="grid gap-8 lg:grid-cols-[clamp(19rem,20%,23rem)_minmax(0,1fr)]">
                <EventMeta event={event} organizerLabel={t("organizer")} priceLabel={t("price")} />
                <EventSchedule
                    dateLabel={t("date")}
                    event={event}
                    locale={locale}
                    placeLabel={t("place")}
                    timeLabel={t("time")}
                />
            </div>
            <EventDescription event={event} facebookLabel={t("facebook")} />
        </article>
    )
}
