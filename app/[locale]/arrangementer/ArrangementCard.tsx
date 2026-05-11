"use client"

import { differenceInCalendarDays, isToday, isTomorrow } from "date-fns"
import { CalendarDays, ExternalLink, MapPin, Ticket } from "lucide-react"
import Image from "next/image"
import { RRule } from "rrule"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"

// ─── Types ────────────────────────────────────────────────────────────────────

export type ArrangementDateEntry = {
    _key: string
    startDate: string
    startTime?: string | null
    endTime?: string | null
}

export type ArrangementSummary = {
    _id: string
    title: string
    slug: string
    isRecurring?: boolean
    rrule?: string | null
    dates: ArrangementDateEntry[]
    isFree?: boolean
    priceOrdinar?: number | null
    priceStudent?: number | null
    priceMedlem?: number | null
    ticketUrl?: string | null
    facebookUrl?: string | null
    imageUrl?: string | null
    imageCaption?: string | null
    room?: {
        _id: string
        title: string
        slug: string
        floor?: number | null
        imageUrl?: string | null
    } | null
    roomText?: string | null
    organizerGroup?: { _id: string; name: string; slug: string } | null
    organizerText?: string | null
    eventType?: {
        _id: string
        name: string
        taxonomyGroup?: { _id: string; name: string } | null
    } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES: Record<AppLocale, string[]> = {
    nb: ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"],
}

function formatShortDate(dateStr: string, locale: AppLocale): string {
    const d = new Date(`${dateStr}T00:00:00`)
    const day = d.getDate()
    const month = MONTH_NAMES[locale][d.getMonth()]
    return `${day}. ${month}`
}

function formatPrimaryDate(date: ArrangementDateEntry, locale: AppLocale): string {
    void locale

    const eventDate = new Date(`${date.startDate}T00:00:00`)
    const daysUntil = differenceInCalendarDays(eventDate, new Date())
    const timeRange = date.startTime
        ? `kl. ${date.endTime ? `${date.startTime}–${date.endTime}` : date.startTime}`
        : null

    let dayLabel: string
    if (isToday(eventDate)) {
        dayLabel = "I dag"
    } else if (isTomorrow(eventDate)) {
        dayLabel = "I morgen"
    } else if (daysUntil > 0 && daysUntil <= 7) {
        dayLabel = `Om ${daysUntil} dager`
    } else {
        dayLabel = new Intl.DateTimeFormat("nb-NO", {
            dateStyle: "long",
            timeZone: "Europe/Oslo",
        }).format(eventDate)
    }

    return timeRange ? `${dayLabel}, ${timeRange}` : dayLabel
}

function getRecurringLabel(rrule: string | null | undefined): string | null {
    if (!rrule) return "Gjentagende"
    const freq = rrule.match(/FREQ=(\w+)/)?.[1]?.toUpperCase()
    if (freq === "DAILY") return "Hver dag"
    if (freq === "WEEKLY") return "Hver uke"
    if (freq === "MONTHLY") return "Hver måned"
    return "Gjentagende"
}

function formatPrices(arrangement: ArrangementSummary, locale: AppLocale): string | null {
    void locale

    if (arrangement.isFree) return "Gratis"
    const parts: string[] = []
    if (arrangement.priceOrdinar != null) parts.push(`Ord. ${arrangement.priceOrdinar} kr`)
    if (arrangement.priceStudent != null) parts.push(`Stud. ${arrangement.priceStudent} kr`)
    if (arrangement.priceMedlem != null) parts.push(`Medl. ${arrangement.priceMedlem} kr`)
    return parts.length > 0 ? parts.join(" / ") : null
}

function expandRRuleDates(
    rruleStr: string,
    seed: ArrangementDateEntry,
    count: number,
): ArrangementDateEntry[] {
    try {
        const rule = new RRule({
            ...RRule.parseString(rruleStr),
            dtstart: new Date(`${seed.startDate}T12:00:00Z`),
        })
        const now = new Date()
        const ceiling = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate())
        return rule
            .between(now, ceiling, true)
            .slice(0, count)
            .map((d, i) => ({
                _key: `rrule-${i}`,
                startDate: d.toISOString().split("T")[0],
                startTime: seed.startTime ?? null,
                endTime: seed.endTime ?? null,
            }))
    } catch {
        return []
    }
}

// ─── DateBadges ───────────────────────────────────────────────────────────────

const MAX_VISIBLE_BADGES = 3

function DateBadges({
    dates,
    primaryIndex,
    locale,
}: {
    dates: ArrangementDateEntry[]
    primaryIndex: number
    locale: AppLocale
}) {
    const otherDates = dates.filter((_, i) => i !== primaryIndex)
    if (otherDates.length === 0) return null

    const visible = otherDates.slice(0, MAX_VISIBLE_BADGES)
    const overflow = otherDates.length - MAX_VISIBLE_BADGES

    return (
        <div className="flex flex-wrap gap-1.5" aria-label="Andre datoer">
            {visible.map(d => (
                <span
                    key={d._key}
                    className="border border-border px-2 py-0.5 text-xs font-heading text-foreground/60 bg-muted"
                >
                    {formatShortDate(d.startDate, locale)}
                </span>
            ))}
            {overflow > 0 && (
                <span className="border border-border px-2 py-0.5 text-xs font-heading text-foreground/60 bg-muted">
                    {overflow >= 9 ? "9+" : `+${overflow}`}
                </span>
            )}
        </div>
    )
}

// ─── ArrangementCard ──────────────────────────────────────────────────────────

export interface ArrangementCardProps {
    arrangement: ArrangementSummary
    facebookLabel: string
    locale: AppLocale
    ticketsLabel: string
}

export function ArrangementCard({
    arrangement,
    facebookLabel,
    locale,
    ticketsLabel,
}: ArrangementCardProps) {
    const seedDate = arrangement.dates[0]
    const todayStr = new Date().toISOString().split("T")[0]!
    const futureDates = arrangement.dates.filter(d => d.startDate >= todayStr)
    const expandedDates: ArrangementDateEntry[] =
        futureDates.length > 0
            ? futureDates
            : arrangement.rrule && seedDate
              ? expandRRuleDates(arrangement.rrule, seedDate, 14)
              : arrangement.dates
    // For rrule events the expansion yields only future dates — use those as the
    // full list. Fall back to the seed date if the rule produces nothing yet.
    const allDates = expandedDates.length > 0 ? expandedDates : seedDate ? [seedDate] : []
    const primaryDate = allDates[0]
    const taxonomy = [
        arrangement.eventType?.name,
        arrangement.organizerGroup?.name ?? arrangement.organizerText,
    ]
        .filter(Boolean)
        .join(" / ")
    const roomTitle = arrangement.room?.title ?? arrangement.roomText
    const roomSlug = arrangement.room?.slug
    const roomFloor = arrangement.room?.floor
    const roomImageUrl = arrangement.room?.imageUrl
    const price = formatPrices(arrangement, locale)
    const href = `/arrangementer/${arrangement.slug}`
    const timeLabel = primaryDate ? formatPrimaryDate(primaryDate, locale) : null

    return (
        <Card className="overflow-hidden bg-card py-0">
            {arrangement.imageUrl && (
                <Link href={href}>
                    <div className="relative aspect-[16/9] w-full">
                        <Image
                            alt={arrangement.imageCaption ?? arrangement.title}
                            className="object-cover"
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            src={arrangement.imageUrl}
                            unoptimized={arrangement.imageUrl.startsWith("blob:")}
                        />
                    </div>
                </Link>
            )}

            <CardContent className="flex h-full flex-col gap-4 p-5">
                {/* Header */}
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-foreground/65">
                        {taxonomy && <span>{taxonomy}</span>}
                        {price && <span>{price}</span>}
                        {arrangement.isRecurring && (
                            <span className="text-foreground/40">
                                {getRecurringLabel(arrangement.rrule)}
                            </span>
                        )}
                    </div>
                    <Link className="hover:underline hover:underline-offset-4" href={href}>
                        <h2 className="font-heading text-2xl leading-tight">{arrangement.title}</h2>
                    </Link>
                </div>

                {/* Primary date and room */}
                <div className="space-y-2 text-sm leading-6 text-foreground/75">
                    {timeLabel && (
                        <p className="flex gap-2">
                            <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden />
                            <span>{timeLabel}</span>
                        </p>
                    )}
                    {roomTitle && (
                        <p className="flex gap-2">
                            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                            {roomSlug ? (
                                <span className="group relative inline-block">
                                    <Link
                                        href={`/rom/${roomSlug}`}
                                        className="hover:underline hover:underline-offset-4"
                                    >
                                        {roomTitle}
                                    </Link>
                                    {(roomImageUrl != null || roomFloor != null) && (
                                        <span className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden w-44 flex-col overflow-hidden rounded border border-border bg-popover shadow-md group-hover:flex">
                                            {roomImageUrl && (
                                                <span className="relative block aspect-[4/3] w-full">
                                                    <Image
                                                        src={roomImageUrl}
                                                        alt={roomTitle}
                                                        fill
                                                        className="object-cover"
                                                        sizes="176px"
                                                        unoptimized={roomImageUrl.startsWith(
                                                            "blob:",
                                                        )}
                                                    />
                                                </span>
                                            )}
                                            {roomFloor != null && (
                                                <span className="px-2 py-1 text-xs text-muted-foreground">
                                                    {roomFloor}. etasje
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </span>
                            ) : (
                                <span>{roomTitle}</span>
                            )}
                        </p>
                    )}
                </div>

                {/* Other date badges */}
                {allDates.length > 1 && (
                    <DateBadges dates={allDates} primaryIndex={0} locale={locale} />
                )}

                {/* Actions */}
                {(arrangement.ticketUrl ?? arrangement.facebookUrl) && (
                    <div className="mt-auto flex flex-wrap gap-3 pt-2">
                        {arrangement.ticketUrl && (
                            <Button asChild size="sm">
                                <a href={arrangement.ticketUrl} rel="noreferrer" target="_blank">
                                    <Ticket aria-hidden />
                                    {ticketsLabel}
                                </a>
                            </Button>
                        )}
                        {arrangement.facebookUrl && (
                            <Button asChild size="sm" variant="neutral">
                                <a href={arrangement.facebookUrl} rel="noreferrer" target="_blank">
                                    <ExternalLink aria-hidden />
                                    {facebookLabel}
                                </a>
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
