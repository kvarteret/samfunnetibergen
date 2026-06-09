"use client"

import { cva, type VariantProps } from "class-variance-authority"

const longDateFormatter = new Intl.DateTimeFormat("nb-NO", {
  dateStyle: "long",
  timeZone: "Europe/Oslo",
})
import { differenceInCalendarDays, isToday, isTomorrow } from "date-fns"
import { CalendarDays, ExternalLink, MapPin, Ticket } from "lucide-react"
import Image from "next/image"
import { RRule } from "rrule"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventDateEntry = {
  _key: string
  startDate: string
  startTime?: string | null
  endTime?: string | null
}

export type EventSummary = {
  _id: string
  title: string
  slug: string
  isRecurring?: boolean
  rrule?: string | null
  dates: EventDateEntry[]
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
  nb: [
    "jan",
    "feb",
    "mar",
    "apr",
    "mai",
    "jun",
    "jul",
    "aug",
    "sep",
    "okt",
    "nov",
    "des",
  ],
}

const eventCardVariants = cva("overflow-hidden py-0", {
  variants: {
    variant: {
      default: "bg-card",
      transparent: "border-0 bg-transparent shadow-none",
    },
    size: {
      default: "",
      small: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

const eventCardContentVariants = cva("flex h-full flex-col", {
  variants: {
    size: {
      default: "gap-4 p-5",
      small: "gap-2 p-3",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  const day = d.getDate()
  const month = MONTH_NAMES["nb"][d.getMonth()]
  return `${day}. ${month}`
}

function formatPrimaryDate(date: EventDateEntry): string {
  const eventDate = new Date(`${date.startDate}T00:00:00`)
  const daysUntil = differenceInCalendarDays(eventDate, new Date())
  const timeRange = date.startTime
    ? formatTimeRange(date.startTime, date.endTime)
    : null

  let dayLabel: string
  if (isToday(eventDate)) {
    dayLabel = "I dag"
  } else if (isTomorrow(eventDate)) {
    dayLabel = "I morgen"
  } else if (daysUntil > 0 && daysUntil <= 7) {
    dayLabel = `Om ${daysUntil} dager`
  } else {
    dayLabel = longDateFormatter.format(eventDate)
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

function expandRRuleDates(
  rruleStr: string,
  seed: EventDateEntry,
  count: number,
): EventDateEntry[] {
  try {
    const rule = new RRule({
      ...RRule.parseString(rruleStr),
      dtstart: new Date(`${seed.startDate}T12:00:00Z`),
    })
    const now = new Date()
    const ceiling = new Date(
      now.getFullYear() + 2,
      now.getMonth(),
      now.getDate(),
    )
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
  size = "default",
}: {
  dates: EventDateEntry[]
  primaryIndex: number
  size?: "default" | "small"
}) {
  const otherDates = dates.filter((_, i) => i !== primaryIndex)
  if (otherDates.length === 0) return null

  const visible = otherDates.slice(0, MAX_VISIBLE_BADGES)
  const overflow = otherDates.length - MAX_VISIBLE_BADGES

  return (
    <div
      className={cn("flex flex-wrap", size === "small" ? "gap-2" : "gap-1.5")}
      aria-label="Andre datoer"
    >
      {visible.map(d => (
        <span
          key={d._key}
          className={cn(
            "border border-border font-heading text-foreground/60 bg-muted",
            size === "small" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-xs",
          )}
        >
          {formatShortDate(d.startDate)}
        </span>
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            "border border-border font-heading text-foreground/60 bg-muted",
            size === "small" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-xs",
          )}
        >
          {overflow >= 9 ? "9+" : `+${overflow}`}
        </span>
      )}
    </div>
  )
}

// ─── EventCard ──────────────────────────────────────────────────────────

export interface EventCardProps extends VariantProps<typeof eventCardVariants> {
  event: EventSummary
  facebookLabel: string
  showActions?: boolean
  showRoom?: boolean
  ticketsLabel: string
}

export function EventCard({
  event,
  facebookLabel,
  showActions = true,
  showRoom = true,
  size,
  ticketsLabel,
  variant,
}: EventCardProps) {
  const cardSize = size ?? "default"
  const todayStr = new Date().toISOString().split("T")[0]!
  const allDates = computeAllDates(event, todayStr)
  const primaryDate = allDates[0]
  const taxonomy = [
    event.eventType?.name,
    event.organizerGroup?.name ?? event.organizerText,
  ]
    .filter(Boolean)
    .join(" / ")
  const roomTitle = event.room?.title ?? event.roomText
  const roomSlug = event.room?.slug
  const roomFloor = event.room?.floor
  const roomImageUrl = event.room?.imageUrl
  const href = `/arrangementer/${event.slug}`
  const timeLabel = primaryDate ? formatPrimaryDate(primaryDate) : null

  return (
    <Card className={eventCardVariants({ variant, size })}>
      {event.imageUrl && (
        <Link href={href}>
          <div
            className={cn(
              "relative w-full overflow-hidden",
              cardSize === "small"
                ? "aspect-[4/3] border-2 border-border bg-muted"
                : "aspect-[16/9]",
            )}
          >
            <Image
              alt={event.imageCaption ?? event.title}
              className={cn(
                "object-cover",
                cardSize === "small" &&
                  "transition-transform duration-300 hover:scale-105",
              )}
              fill
              sizes={
                cardSize === "small"
                  ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  : "(max-width: 768px) 100vw, 50vw"
              }
              src={event.imageUrl}
              unoptimized={event.imageUrl.startsWith("blob:")}
            />
          </div>
        </Link>
      )}

      <CardContent className={eventCardContentVariants({ size: cardSize })}>
        <div className="space-y-2">
          <div
            className={cn(
              "flex flex-wrap gap-2 uppercase text-foreground/65",
              cardSize === "small"
                ? "justify-between text-[11px] tracking-[0.12em]"
                : "text-xs tracking-[0.18em]",
            )}
          >
            {taxonomy && <span>{taxonomy}</span>}
            {event.isRecurring && (
              <span className="text-foreground/40">
                {getRecurringLabel(event.rrule)}
              </span>
            )}
          </div>
          <Link
            className="hover:underline hover:underline-offset-4"
            href={href}
          >
            <h2
              className={cn(
                "font-heading leading-tight",
                cardSize === "small" ? "text-lg" : "text-2xl",
              )}
            >
              {event.title}
            </h2>
          </Link>
        </div>

        <div
          className={cn(
            "space-y-2 leading-6 text-foreground/75",
            cardSize === "small" ? "text-xs" : "text-sm",
          )}
        >
          {timeLabel && (
            <p className="flex gap-2">
              <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{timeLabel}</span>
            </p>
          )}
          {showRoom && roomTitle && (
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
                            unoptimized={roomImageUrl.startsWith("blob:")}
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

        {allDates.length > 1 && (
          <DateBadges dates={allDates} primaryIndex={0} size={cardSize} />
        )}

        {showActions && (event.ticketUrl ?? event.facebookUrl) && (
          <div className="mt-auto flex flex-wrap gap-3 pt-2">
            {event.ticketUrl && (
              <Button asChild size="sm">
                <a href={event.ticketUrl} rel="noreferrer" target="_blank">
                  <Ticket aria-hidden />
                  {ticketsLabel}
                </a>
              </Button>
            )}
            {event.facebookUrl && (
              <Button asChild size="sm" variant="neutral">
                <a href={event.facebookUrl} rel="noreferrer" target="_blank">
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

function formatTimeRange(start: string, end?: string | null): string {
  if (end) return `kl. ${start}–${end}`
  return `kl. ${start}`
}

function computeAllDates(
  event: EventSummary,
  todayStr: string,
): EventDateEntry[] {
  const seedDate = event.dates[0]
  const futureDates = event.dates.filter(d => d.startDate >= todayStr)
  if (futureDates.length > 0) return futureDates

  if (event.rrule && seedDate) {
    const expanded = expandRRuleDates(event.rrule, seedDate, 14)
    if (expanded.length > 0) return expanded
  }

  return seedDate ? [seedDate] : []
}
