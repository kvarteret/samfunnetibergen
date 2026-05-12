"use client"

import { CalendarDays, ExternalLink, MapPin, Ticket } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    type EventDetail,
    formatEventTimeRange,
    getEventDescriptionPreview,
} from "@/features/events/domain/eventsUtils"
import { Link } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"

// ─── EventCardImage ───────────────────────────────────────────────────────────

interface EventCardImageProps {
    alt: string
    href: string
    src?: string | null
}

const EventCardImage = ({ alt, href, src }: EventCardImageProps) =>
    src ? (
        <Link href={href}>
            <div className="relative aspect-[16/9] w-full">
                <Image
                    alt={alt}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    src={src}
                />
            </div>
        </Link>
    ) : null

// ─── EventCardHeader ──────────────────────────────────────────────────────────

interface EventCardHeaderProps {
    price?: string | null
    taxonomy: string
    title: string
}

const EventCardHeader = ({ price, taxonomy, title }: EventCardHeaderProps) => (
    <div className="space-y-2">
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-foreground/65">
            {taxonomy ? <span>{taxonomy}</span> : null}
            {price ? <span>{price}</span> : null}
        </div>
        <h2 className="font-heading text-2xl leading-tight">{title}</h2>
    </div>
)

// ─── EventCardDetails ─────────────────────────────────────────────────────────

interface EventCardDetailsProps {
    room?: string | null
    time: string
}

const EventCardDetails = ({ room, time }: EventCardDetailsProps) => (
    <div className="space-y-2 text-sm leading-6 text-foreground/75">
        <p className="flex gap-2">
            <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{time}</span>
        </p>
        {room ? (
            <p className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{room}</span>
            </p>
        ) : null}
    </div>
)

// ─── EventCardActions ─────────────────────────────────────────────────────────

interface EventCardActionsProps {
    facebookLabel: string
    facebookUrl?: string | null
    ticketUrl?: string | null
    ticketsLabel: string
}

const EventCardActions = ({
    facebookLabel,
    facebookUrl,
    ticketUrl,
    ticketsLabel,
}: EventCardActionsProps) => {
    const hasTicket = Boolean(ticketUrl)
    const hasFacebook = Boolean(facebookUrl)

    if (!hasTicket && !hasFacebook) return null

    return (
        <div className="mt-auto flex flex-wrap gap-3 pt-2">
            {hasTicket && (
                <Button asChild size="sm">
                    <a href={ticketUrl!} rel="noreferrer" target="_blank">
                        <Ticket aria-hidden="true" />
                        {ticketsLabel}
                    </a>
                </Button>
            )}
            {hasFacebook && (
                <Button asChild size="sm" variant="neutral">
                    <a href={facebookUrl!} rel="noreferrer" target="_blank">
                        <ExternalLink aria-hidden="true" />
                        {facebookLabel}
                    </a>
                </Button>
            )}
        </div>
    )
}

// ─── EventCard ────────────────────────────────────────────────────────────────

export interface EventCardProps {
    event: EventDetail
    facebookLabel: string
    locale: AppLocale
    ticketsLabel: string
}

export function EventCard({ event, facebookLabel, locale, ticketsLabel }: EventCardProps) {
    const preview = getEventDescriptionPreview(event.description)
    const taxonomy = [
        event.event_type?.name,
        event.organizer_groups.map(group => group.name).join(", "),
    ]
        .filter(Boolean)
        .join(" / ")
    const room = event.room?.name ?? event.room_text
    const time = formatEventTimeRange(event, locale)
    const href = `/arrangementer/${event.slug || event.id}`

    return (
        <Card className="overflow-hidden bg-card py-0">
            <EventCardImage
                alt={event.image_caption || event.title}
                href={href}
                src={event.image_url}
            />
            <CardContent className="flex h-full flex-col gap-4 p-5">
                <Link className="hover:underline hover:underline-offset-4" href={href}>
                    <EventCardHeader price={event.price} taxonomy={taxonomy} title={event.title} />
                </Link>
                <EventCardDetails room={room} time={time} />
                {preview ? <p className="text-sm leading-6 text-foreground/80">{preview}</p> : null}
                <EventCardActions
                    facebookLabel={facebookLabel}
                    facebookUrl={event.facebook_url}
                    ticketUrl={event.ticket_url}
                    ticketsLabel={ticketsLabel}
                />
            </CardContent>
        </Card>
    )
}
