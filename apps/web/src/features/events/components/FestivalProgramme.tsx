import { CalendarDays, MapPin, Ticket } from "lucide-react"
import type { ReactNode } from "react"
import { selectionControlVariants } from "@/components/ui/selection-control"
import type { PublicEvent } from "@/features/events/domain/events"
import {
  type FestivalDay,
  festivalDate,
  festivalRunDays,
} from "@/features/events/domain/festival-programme"
import { cn } from "@/lib/utils"
import { EventCard } from "./EventCard"

export type FestivalLabels = {
  programme: string
  browseDays: string
  eventCount: (count: number) => string
  runDays: (count: number) => string
  soldOut: string
  cancelled: string
  timeUnknown: string
  empty: string
}

/**
 * A text header in the style of /arrangementer: the festival's whole run,
 * where it happens, what it costs and how much is on.
 */
export function FestivalHero({
  event,
  days,
  locale,
  labels,
  price,
  children,
}: {
  event: PublicEvent
  days: FestivalDay[]
  locale: string
  labels: FestivalLabels
  price?: string | null
  children?: ReactNode
}) {
  const occurrences = days.flatMap(day => day.occurrences)
  const venues = [
    ...new Set(
      occurrences
        .map(({ event }) => event.room?.title || event.roomText)
        .filter(Boolean),
    ),
  ]
  const first = occurrences[0]?.schedule
  const lastDay = days.at(-1)
  const runDays = lastDay ? festivalRunDays(days[0].date, lastDay.date) : 0

  return (
    <header className="space-y-5">
      <h1 className="text-page-title">{event.title}</h1>
      <ul className="flex flex-wrap gap-x-6 gap-y-2 text-lg text-foreground-muted">
        {first && (
          <FestivalFact icon={CalendarDays}>
            <time dateTime={first.startDate}>
              {capitalize(festivalDate(first.startDate, locale, true), locale)}
              {first.startTime && `, ${first.startTime}`}
            </time>
            {runDays > 1 && ` · ${labels.runDays(runDays)}`}
          </FestivalFact>
        )}
        {venues.length > 0 && (
          <FestivalFact icon={MapPin}>{venues.join(" · ")}</FestivalFact>
        )}
        {price && <FestivalFact icon={Ticket}>{price}</FestivalFact>}
      </ul>
      {children && (
        <div className="max-w-prose space-y-3 text-lg leading-8 text-foreground">
          {children}
        </div>
      )}
    </header>
  )
}

function FestivalFact({
  icon: Icon,
  children,
}: {
  icon: typeof CalendarDays
  children: ReactNode
}) {
  return (
    <li className="flex items-center gap-2">
      <Icon className="size-5 shrink-0" aria-hidden />
      <span>{children}</span>
    </li>
  )
}

export function FestivalProgramme({
  days,
  locale,
  labels,
}: {
  days: FestivalDay[]
  locale: string
  labels: FestivalLabels
}) {
  const total = days.reduce((sum, day) => sum + day.occurrences.length, 0)

  return (
    <section
      id="festival-programme"
      aria-labelledby="festival-programme-heading"
      className="scroll-mt-24 space-y-10"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 id="festival-programme-heading" className="text-section-title">
            {labels.programme}
          </h2>
          {total > 0 && (
            <p className="text-sm text-foreground-muted">
              {labels.eventCount(total)}
            </p>
          )}
        </div>
        {days.length > 1 && (
          <nav aria-label={labels.browseDays} className="flex flex-wrap gap-2">
            {days.map(day => (
              <a
                key={day.date}
                href={`#festival-day-${day.date}`}
                className={cn(
                  selectionControlVariants({ size: "default" }),
                  "gap-2 rounded-full px-4",
                )}
              >
                {capitalize(festivalDayChip(day.date, locale), locale)}
                <span className="text-sm text-foreground-muted">
                  {day.occurrences.length}
                </span>
              </a>
            ))}
          </nav>
        )}
      </div>
      {days.length === 0 ? (
        <p className="text-foreground-muted">{labels.empty}</p>
      ) : (
        days.map(day => (
          <section
            key={day.date}
            id={`festival-day-${day.date}`}
            aria-labelledby={`festival-heading-${day.date}`}
            className="scroll-mt-24 space-y-6"
          >
            <h3
              id={`festival-heading-${day.date}`}
              className="flex flex-wrap items-baseline gap-x-3 border-b-2 border-border pb-3 text-2xl sm:text-3xl"
            >
              <time dateTime={day.date}>
                {capitalize(festivalDate(day.date, locale, true), locale)}
              </time>
              <span className="font-sans font-base text-sm text-foreground-muted">
                {labels.eventCount(day.occurrences.length)}
              </span>
            </h3>
            <ul className="grid gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-3 xl:gap-x-8">
              {day.occurrences.map(occurrence => (
                <li key={occurrence.id} className="min-w-0">
                  <FestivalCard
                    event={occurrence.event}
                    dateKey={occurrence.dateKey}
                    labels={labels}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </section>
  )
}

/** The catalogue card, narrowed to one screening of a festival event. */
function FestivalCard({
  event,
  dateKey,
  labels,
}: {
  event: PublicEvent
  dateKey: string
  labels: FestivalLabels
}) {
  const cancelled = event.eventStatus !== "scheduled"
  const dates = event.dates.filter(date => date._key === dateKey)
  const date = dates[0]
  const time = date?.startTime
    ? date.endTime
      ? `${date.startTime}–${date.endTime}`
      : date.startTime
    : labels.timeUnknown

  return (
    <EventCard
      variant="catalogue"
      showFestivalBadge={false}
      trackingSurface="detail-child"
      event={{
        ...event,
        dates,
        resolvedDates: dates,
        primaryDateLabel: time,
        statusLabel: cancelled
          ? labels.cancelled
          : event.isSoldOut
            ? labels.soldOut
            : null,
      }}
    />
  )
}

function festivalDayChip(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "nb" ? "nb-NO" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Oslo",
  })
    .format(new Date(`${date}T12:00:00Z`))
    .replace(/\.(?=\s|$)/g, "")
}

function capitalize(value: string, locale: string): string {
  return value.charAt(0).toLocaleUpperCase(locale) + value.slice(1)
}
