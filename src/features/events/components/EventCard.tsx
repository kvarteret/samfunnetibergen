import { cva, type VariantProps } from "class-variance-authority"
import { CalendarDays, ExternalLink, MapPin, Ticket } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tag } from "@/components/ui/tag"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { DateBadges } from "./DateBadges"

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
  /** Precomputed server-side. Used directly by the card. */
  resolvedDates?: EventDateEntry[]
  /** Precomputed server-side. Falls back to null if absent. */
  recurringLabel?: string | null
  /** Precomputed server-side label for the primary date (e.g. "I dag, kl. 21:00–02:00"). */
  primaryDateLabel?: string | null
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

// ─── Variants ─────────────────────────────────────────────────────────────────

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

// ─── EventCard ────────────────────────────────────────────────────────────────

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
  const allDates = event.resolvedDates ?? event.dates
  const taxonomy = [
    event.eventType?.name,
    event.organizerGroup?.name ?? event.organizerText,
  ]
    .filter(Boolean)
    .join(" / ")
  const roomTitle = event.room?.title ?? event.roomText
  const roomSlug = event.room?.slug
  const roomFloor = event.room?.floor
  const href = `/arrangementer/${event.slug}`
  const timeLabel = event.primaryDateLabel
  const recurringLabel = event.recurringLabel

  return (
    <Card
      className={cn(
        eventCardVariants({ variant, size }),
        cardSize === "small" && "group interactive-brutal",
      )}
    >
      {event.imageUrl && (
        <Link href={href}>
          <div
            className={cn(
              "relative w-full overflow-hidden",
              cardSize === "small"
                ? "aspect-4/3 border-2 border-border bg-muted"
                : "aspect-video",
            )}
          >
            <Image
              alt={event.imageCaption ?? event.title}
              className={cn(
                "object-cover",
                cardSize === "small" &&
                  "transition-transform duration-300 group-hover:scale-105",
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
              "flex flex-wrap gap-2 text-foreground-subtle",
              cardSize === "small"
                ? "justify-between text-eyebrow-sm"
                : "text-eyebrow",
            )}
          >
            {taxonomy && <span>{taxonomy}</span>}
            {recurringLabel && <Tag variant="outline">{recurringLabel}</Tag>}
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
            "space-y-2 leading-6 text-foreground-muted",
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
                <Link
                  href={`/rom/${roomSlug}`}
                  className="hover:underline hover:underline-offset-4"
                >
                  {roomTitle}
                  {roomFloor != null && ` · ${roomFloor}. etasje`}
                </Link>
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
