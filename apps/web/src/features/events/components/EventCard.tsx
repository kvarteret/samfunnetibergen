import { cva, type VariantProps } from "class-variance-authority"
import { CalendarDays, MapPin } from "lucide-react"
import Image from "next/image"

import { Card, CardContent } from "@/components/ui/card"
import { Tag } from "@/components/ui/tag"
import { Link } from "@/i18n/navigation"
import { eventTrackingAttributes } from "@/lib/posthog/tracking-attributes"
import { sanityImageUrl } from "@/lib/sanity/image-url"
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
  /** Precomputed server-side label for the primary date (e.g. "I dag, 21:00–02:00"). */
  primaryDateLabel?: string | null
  /** Precomputed server-side label when the event is cancelled. */
  statusLabel?: string | null
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

const eventCardVariants = cva("group block h-full min-w-0 focus-brutal", {
  variants: {
    variant: {
      default: "",
      catalogue: "",
      promoted: "",
      slider: "",
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

const eventCardSurfaceVariants = cva("h-full overflow-hidden gap-0 py-0", {
  variants: {
    variant: {
      default: "bg-card",
      catalogue: "border-0 bg-card shadow-none",
      promoted: "border-0 bg-card shadow-none",
      slider: "border-0 bg-primary shadow-none text-primary-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const eventCardContentVariants = cva("flex h-full flex-col", {
  variants: {
    variant: {
      default: "gap-4 p-5",
      catalogue: "gap-3 px-0 pt-3 pb-1",
      promoted: "gap-3 px-0 pt-3 pb-1",
      slider: "gap-2 px-0 pt-3 pb-1 text-primary-foreground",
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

// ─── EventCard ────────────────────────────────────────────────────────────────

export interface EventCardProps extends VariantProps<typeof eventCardVariants> {
  event: EventSummary
  priority?: boolean
  showRoom?: boolean
  trackingSurface?: string
}

type EventCardVariant = "default" | "catalogue" | "promoted" | "slider"
type EventCardSize = "default" | "small"

export function EventCard({
  event,
  priority = false,
  showRoom = true,
  size,
  trackingSurface = "card-title",
  variant,
}: EventCardProps) {
  const cardSize = size ?? "default"
  const cardVariant = variant ?? "default"
  const isEditorial = cardVariant !== "default"
  const allDates = event.resolvedDates ?? event.dates
  const eventTypeLabel = event.eventType?.name
  const roomTitle = event.room?.title ?? event.roomText
  const roomFloor = event.room?.floor
  const href = `/arrangementer/${event.slug}`
  const timeLabel = event.primaryDateLabel
  const imageUrl = event.imageUrl
    ? sanityImageUrl(
        event.imageUrl,
        cardVariant === "slider"
          ? { fit: "max", width: 640 }
          : { fit: "max", width: 1200 },
      )
    : null

  return (
    <Link
      className={eventCardVariants({ variant: cardVariant, size: cardSize })}
      {...eventTrackingAttributes(event, trackingSurface)}
      href={href}
    >
      <Card className={eventCardSurfaceVariants({ variant: cardVariant })}>
        <EventCardMedia
          cardSize={cardSize}
          cardVariant={cardVariant}
          event={event}
          imageUrl={imageUrl}
          isEditorial={isEditorial}
          priority={priority}
        />

        <CardContent
          className={eventCardContentVariants({
            size: cardSize,
            variant: cardVariant,
          })}
        >
          <EventCardHeader
            cardSize={cardSize}
            cardVariant={cardVariant}
            event={event}
            isEditorial={isEditorial}
            onPrimary={cardVariant === "slider"}
            statusLabel={event.statusLabel}
            eventTypeLabel={eventTypeLabel}
            timeLabel={timeLabel}
          />
          <EventCardDetails
            isEditorial={isEditorial}
            roomFloor={roomFloor}
            roomTitle={showRoom ? roomTitle : null}
            small={cardVariant === "slider"}
            onPrimary={cardVariant === "slider"}
            timeLabel={timeLabel}
          />

          {allDates.length > 1 && (
            <DateBadges dates={allDates} primaryIndex={0} size={cardSize} />
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

function EventCardMedia({
  cardSize,
  cardVariant,
  event,
  imageUrl,
  isEditorial,
  priority,
}: {
  cardSize: EventCardSize
  cardVariant: EventCardVariant
  event: EventSummary
  imageUrl: string | null
  isEditorial: boolean
  priority: boolean
}) {
  if (!imageUrl && !isEditorial) return null

  return (
    <div
      className={cn(
        "group/image relative w-full shrink-0 overflow-hidden bg-muted",
        "aspect-video",
        cardSize === "small" && !isEditorial && "border-2 border-border",
      )}
    >
      {imageUrl ? (
        <Image
          alt={event.imageCaption ?? event.title}
          className="object-contain"
          fill
          priority={priority}
          sizes={
            cardVariant === "slider"
              ? "(max-width: 640px) calc(100vw - 3rem), 21rem"
              : "(max-width: 768px) 100vw, (max-width: 1279px) 50vw, 33vw"
          }
          src={imageUrl}
          unoptimized={imageUrl.startsWith("blob:")}
        />
      ) : (
        <div className="flex h-full items-center justify-center p-6 text-center font-heading text-foreground-muted">
          {event.title}
        </div>
      )}
    </div>
  )
}

function EventCardHeader({
  cardSize,
  cardVariant,
  event,
  isEditorial,
  onPrimary,
  statusLabel,
  eventTypeLabel,
  timeLabel,
}: {
  cardSize: EventCardSize
  cardVariant: EventCardVariant
  event: EventSummary
  isEditorial: boolean
  onPrimary: boolean
  statusLabel?: string | null
  eventTypeLabel?: string | null
  timeLabel?: string | null
}) {
  return (
    <div className={cn("space-y-2", cardVariant !== "slider" && "flex-1")}>
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-2 gap-y-2",
          onPrimary ? "text-primary-foreground" : "text-foreground-muted",
          isEditorial ? "text-sm" : "font-heading uppercase tracking-widest",
        )}
      >
        {eventTypeLabel &&
          (isEditorial ? (
            <Tag variant="accent">{eventTypeLabel}</Tag>
          ) : (
            <span>{eventTypeLabel}</span>
          ))}
        {isEditorial && timeLabel && (
          <span className="font-heading">{timeLabel}</span>
        )}
        {statusLabel && <Tag variant="destructive">{statusLabel}</Tag>}
      </div>

      <h2
        className={cn(
          "font-heading leading-tight group-hover:underline group-hover:underline-offset-2",
          editorialHeadingClass({
            cardSize,
            cardVariant,
            isEditorial,
          }),
        )}
      >
        {event.title}
      </h2>
    </div>
  )
}

function editorialHeadingClass({
  cardSize,
  cardVariant,
  isEditorial,
}: {
  cardSize: EventCardSize
  cardVariant: EventCardVariant
  isEditorial: boolean
}) {
  if (isEditorial) return cardVariant === "slider" ? "text-xl" : "text-2xl"
  return cardSize === "small" ? "text-lg" : "text-2xl"
}

function EventCardDetails({
  isEditorial,
  onPrimary,
  roomFloor,
  roomTitle,
  small,
  timeLabel,
}: {
  isEditorial: boolean
  onPrimary: boolean
  roomFloor?: number | null
  roomTitle?: string | null
  small: boolean
  timeLabel?: string | null
}) {
  if (isEditorial) {
    return (
      <EventLocation
        roomFloor={roomFloor}
        roomTitle={roomTitle}
        small={small}
        onPrimary={onPrimary}
      />
    )
  }

  return (
    <div className="space-y-2 leading-6 text-foreground-muted">
      {timeLabel && (
        <p className="flex gap-2">
          <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{timeLabel}</span>
        </p>
      )}
      {roomTitle && (
        <EventLocation
          roomFloor={roomFloor}
          roomTitle={roomTitle}
          small={small}
          onPrimary={onPrimary}
        />
      )}
    </div>
  )
}

function EventLocation({
  roomFloor,
  roomTitle,
  small,
  onPrimary,
}: {
  roomFloor?: number | null
  roomTitle?: string | null
  small: boolean
  onPrimary: boolean
}) {
  if (!roomTitle) return null

  return (
    <div
      className={cn(
        "space-y-1 leading-6",
        onPrimary ? "text-primary-foreground" : "text-foreground-muted",
        small && "text-sm",
      )}
    >
      <p className="flex gap-2">
        <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          {roomTitle}
          {roomFloor != null && ` · ${roomFloor}. etasje`}
        </span>
      </p>
    </div>
  )
}
