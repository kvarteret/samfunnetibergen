import type { ImageFrame } from "@samfunnet/content-domain/image-frame"
import { cva, type VariantProps } from "class-variance-authority"
import { CalendarDays, MapPin, Repeat, Tent } from "lucide-react"
import { useTranslations } from "next-intl"
import { SanityImage } from "@/components/sanity-image"

import { Card, CardContent } from "@/components/ui/card"
import { Tag } from "@/components/ui/tag"
import { Link } from "@/i18n/navigation"
import { eventTrackingAttributes } from "@/lib/posthog/tracking-attributes"
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
  isPromoted?: boolean
  promotedPlacement?: "top" | "pool" | null
  promotedOrder?: number | null
  initialSlug?: string | null
  _id: string
  title: string
  slug: string
  eventKind?:
    | "single"
    | "seriesParent"
    | "seriesInstance"
    | "festivalParent"
    | "festivalSession"
  isRecurring?: boolean
  rrule?: string | null
  dates: EventDateEntry[]
  /** Precomputed server-side. Used directly by the card. */
  resolvedDates?: EventDateEntry[]
  /** Precomputed server-side. Falls back to null if absent. */
  recurringLabel?: string | null
  /** Precomputed server-side label for the primary date (e.g. "I dag, 21:00–02:00"). */
  primaryDateLabel?: string | null
  /** Precomputed server-side count for parents, e.g. "34 arrangementer". */
  programmeLabel?: string | null
  /** Precomputed server-side label when the event is cancelled. */
  statusLabel?: string | null
  eventStatus?: string | null
  isSoldOut?: boolean
  isFree?: boolean
  priceOrdinar?: number | null
  priceStudent?: number | null
  priceMedlem?: number | null
  ticketUrl?: string | null
  facebookUrl?: string | null
  imageUrl?: string | null
  imageFrame?: ImageFrame | null
  imageAlt?: string | null
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
  coOrganizerGroups?: Array<{ _id: string; name: string; slug: string }>
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
  showFestivalBadge?: boolean
  trackingSurface?: string
  trackingPosition?: number
}

type EventCardVariant = "default" | "catalogue" | "promoted" | "slider"

// Rendered card widths, so the browser picks the smallest image that is still
// sharp. Content is at most 1168px wide with 24px gutters on phones; listings
// show 2 columns from md and 3 from xl, promoted cards 3 from md.
const CARD_IMAGE_SIZES: Record<EventCardVariant, string> = {
  default:
    "(min-width: 1280px) 368px, (min-width: 768px) calc(50vw - 3.5rem), calc(100vw - 3rem)",
  catalogue:
    "(min-width: 1280px) 368px, (min-width: 768px) calc(50vw - 3.5rem), calc(100vw - 3rem)",
  promoted:
    "(min-width: 1280px) 370px, (min-width: 768px) calc(33vw - 3rem), calc(100vw - 3rem)",
  slider: "(max-width: 640px) calc(100vw - 3rem), 21rem",
}
type EventCardSize = "default" | "small"

export function EventCard({
  event,
  priority = false,
  showRoom = true,
  showFestivalBadge = true,
  size,
  trackingSurface = "events-list",
  trackingPosition,
  variant,
}: EventCardProps) {
  const t = useTranslations("EventCard")
  const cardSize = size ?? "default"
  const cardVariant = variant ?? "default"
  const isEditorial = cardVariant !== "default"
  const allDates = event.resolvedDates ?? event.dates
  const eventTypeLabel = event.eventType?.name
  const roomTitle = event.room?.title ?? event.roomText
  const roomFloor = event.room?.floor
  const href = `/arrangementer/${event.slug}`
  const timeLabel = event.primaryDateLabel

  return (
    <Link
      className={eventCardVariants({ variant: cardVariant, size: cardSize })}
      {...eventTrackingAttributes(event, trackingSurface, trackingPosition)}
      href={href}
    >
      <Card className={eventCardSurfaceVariants({ variant: cardVariant })}>
        <EventCardMedia
          cardSize={cardSize}
          cardVariant={cardVariant}
          event={event}
          isEditorial={isEditorial}
          priority={priority}
          showFestivalBadge={showFestivalBadge}
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
            statusLabel={
              event.eventStatus === "cancelled"
                ? t("statusCancelled")
                : event.eventStatus === "postponed"
                  ? t("statusPostponed")
                  : (event.statusLabel ??
                    (event.isSoldOut ? t("soldOut") : null))
            }
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

          <EventCardBadges
            allDates={allDates}
            cardSize={cardSize}
            event={event}
          />
        </CardContent>
      </Card>
    </Link>
  )
}

/**
 * Parents summarise their programme instead of listing child dates, and series
 * state their rhythm: every date of a weekly series is the same by definition.
 */
function EventCardBadges({
  allDates,
  cardSize,
  event,
}: {
  allDates: EventDateEntry[]
  cardSize: EventCardSize
  event: EventSummary
}) {
  const isSeries =
    event.eventKind === "seriesParent" || event.eventKind === "seriesInstance"
  const summary =
    event.eventKind === "festivalParent"
      ? event.programmeLabel
      : isSeries
        ? event.recurringLabel
        : null

  if (summary) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-base bg-accent font-heading text-accent-foreground",
            cardSize === "small"
              ? "px-2.5 py-1 text-sm"
              : "px-2 py-0.5 text-sm",
          )}
        >
          {isSeries && <Repeat className="size-3.5" aria-hidden />}
          {summary}
        </span>
      </div>
    )
  }
  if (event.eventKind === "festivalParent" || allDates.length <= 1) return null

  return <DateBadges dates={allDates} primaryIndex={0} size={cardSize} />
}

function EventCardMedia({
  cardSize,
  cardVariant,
  event,
  isEditorial,
  priority,
  showFestivalBadge,
}: {
  cardSize: EventCardSize
  cardVariant: EventCardVariant
  event: EventSummary
  isEditorial: boolean
  priority: boolean
  showFestivalBadge: boolean
}) {
  const imageUrl = event.imageUrl
  if (!imageUrl && !isEditorial) return null

  return (
    <div
      className={cn(
        "group/image relative w-full shrink-0 overflow-hidden bg-muted",
        "aspect-4/3",
        cardSize === "small" && !isEditorial && "border-2 border-border",
      )}
    >
      {imageUrl ? (
        <SanityImage
          alt={event.imageAlt ?? event.imageCaption ?? event.title}
          aspectRatio={4 / 3}
          className={cn(
            isEditorial &&
              "transition-transform duration-300 group-hover/image:scale-105",
          )}
          frame={event.imageFrame}
          priority={priority}
          sizes={CARD_IMAGE_SIZES[cardVariant]}
          src={imageUrl}
        />
      ) : (
        <div className="flex h-full items-center justify-center p-6 text-center font-heading text-foreground-muted">
          {event.title}
        </div>
      )}
      {showFestivalBadge &&
        (event.eventKind === "festivalParent" ||
          event.eventKind === "festivalSession") && (
          <Tag
            variant="accent"
            className="absolute bottom-3 right-3 gap-1.5 text-sm"
          >
            <Tent className="size-4" aria-hidden />
            Festival
          </Tag>
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
          <span className="font-heading tabular-nums">{timeLabel}</span>
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
  if (isEditorial)
    return cardVariant === "slider" ? "text-xl" : "text-card-title"
  return cardSize === "small" ? "text-lg" : "text-card-title"
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
          <span className="tabular-nums">{timeLabel}</span>
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
  const t = useTranslations("EventCard")
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
          {roomFloor != null && ` · ${t("floor", { floor: roomFloor })}`}
        </span>
      </p>
    </div>
  )
}
