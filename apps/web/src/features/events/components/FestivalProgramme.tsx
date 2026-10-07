import { EventTicketButton } from "@/app/[locale]/arrangementer/[event]/EventTrackedLinks"
import type { PublicEvent } from "@/features/events/domain/events"
import {
  type FestivalDay,
  festivalDate,
} from "@/features/events/domain/festival-programme"
import { EventCard } from "./EventCard"

export type FestivalLabels = {
  programme: string
  browseDays: string
  events: string
  days: string
  about: string
  details: string
  tickets: string
  soldOut: string
  cancelled: string
  timeUnknown: string
  empty: string
}

export function FestivalHero({
  event,
  days,
  locale,
  labels,
}: {
  event: PublicEvent
  days: FestivalDay[]
  locale: string
  labels: FestivalLabels
}) {
  const occurrences = days.flatMap(day => day.occurrences)
  const venues = [
    ...new Set(
      occurrences
        .map(({ event }) => event.room?.title || event.roomText)
        .filter(Boolean),
    ),
  ]
  return (
    <header className="space-y-2">
      <h1 className="wrap-break-word font-heading text-3xl leading-tight sm:text-4xl">
        {event.title}
      </h1>
      {days.length > 0 && (
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-base text-foreground-muted">
          <span>
            {festivalDate(days[0].date, locale)}
            {days.length > 1 &&
              ` – ${festivalDate(days[days.length - 1].date, locale)}`}
          </span>
          {venues.length > 0 && <span>{venues.join(" · ")}</span>}
          <span>
            {occurrences.length} {labels.events}
          </span>
        </p>
      )}
    </header>
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
  return (
    <section
      id="festival-programme"
      aria-labelledby="festival-programme-heading"
      className="scroll-mt-24 space-y-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-border pb-4">
        <h2
          id="festival-programme-heading"
          className="font-heading text-3xl uppercase tracking-wide sm:text-4xl"
        >
          {labels.programme}
        </h2>
        <a
          href="#festival-about"
          className="underline underline-offset-4 focus-brutal"
        >
          {labels.about}
        </a>
      </div>
      {days.length === 0 ? (
        <p className="text-foreground-muted">{labels.empty}</p>
      ) : (
        <>
          <nav aria-label={labels.browseDays} className="flex flex-wrap gap-2">
            {days.map(day => (
              <a
                key={day.date}
                href={`#festival-day-${day.date}`}
                className="border-2 border-border bg-background px-3 py-2 text-sm font-heading transition-colors hover:bg-primary hover:text-primary-foreground focus-brutal"
              >
                {festivalDate(day.date, locale, true)}
                <span className="ml-2 text-sm">({day.occurrences.length})</span>
              </a>
            ))}
          </nav>
          {days.map(day => (
            <section
              key={day.date}
              id={`festival-day-${day.date}`}
              aria-labelledby={`festival-heading-${day.date}`}
              className="scroll-mt-24 space-y-5"
            >
              <h3
                id={`festival-heading-${day.date}`}
                className="border-l-4 border-primary pl-4 font-heading text-2xl capitalize sm:text-3xl"
              >
                <time dateTime={day.date}>
                  {festivalDate(day.date, locale, true)}
                </time>
              </h3>
              <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {day.occurrences.map(occurrence => (
                  <li key={occurrence.id} className="flex">
                    <FestivalCard
                      event={occurrence.event}
                      dateKey={occurrence.dateKey}
                      time={occurrence.schedule.startTime}
                      labels={labels}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </section>
  )
}

function FestivalCard({
  event,
  time,
  dateKey,
  labels,
}: {
  event: PublicEvent
  time: string | null
  dateKey: string
  labels: FestivalLabels
}) {
  const cancelled = event.eventStatus !== "scheduled"
  const dates = event.dates.filter(date => date._key === dateKey)
  return (
    <article className="flex w-full flex-col">
      <EventCard
        variant="catalogue"
        showFestivalBadge={false}
        trackingSurface="detail-child"
        event={{
          ...event,
          dates,
          resolvedDates: dates,
          primaryDateLabel: time || labels.timeUnknown,
          statusLabel: cancelled
            ? labels.cancelled
            : event.isSoldOut
              ? labels.soldOut
              : null,
        }}
      />
      <div className="pt-3">
        {cancelled || event.isSoldOut ? (
          <p className="font-heading uppercase tracking-wide text-destructive">
            {cancelled ? labels.cancelled : labels.soldOut}
          </p>
        ) : event.ticketUrl ? (
          <EventTicketButton
            ticketUrl={event.ticketUrl}
            label={labels.tickets}
            eventId={event._id}
            eventTitle={event.title}
            eventSlug={event.slug}
          />
        ) : null}
      </div>
    </article>
  )
}
