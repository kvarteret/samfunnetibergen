import { ArrowDown } from "lucide-react"
import Image from "next/image"
import { EventTicketButton } from "@/app/[locale]/arrangementer/[event]/EventTrackedLinks"
import { buttonVariants } from "@/components/ui/button"
import type { PublicEvent } from "@/features/events/domain/events"
import {
  type FestivalDay,
  festivalDate,
} from "@/features/events/domain/festival-programme"
import { shouldLoadImageDirectly } from "@/lib/sanity/image-url"
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
    <header className="grid overflow-hidden border-2 border-border bg-muted lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
      <div className="flex flex-col items-start justify-center gap-6 p-6 sm:p-10 lg:p-12">
        <p className="bg-primary px-3 py-1.5 font-heading uppercase tracking-widest text-primary-foreground">
          {event.eventType?.name || "Festival"}
        </p>
        <h1 className="wrap-break-word font-heading text-4xl leading-tight sm:text-5xl lg:text-6xl">
          {event.title}
        </h1>
        {days.length > 0 && (
          <div className="space-y-2 text-lg">
            <p className="font-heading text-2xl">
              {festivalDate(days[0].date, locale)}
              {days.length > 1 &&
                ` – ${festivalDate(days[days.length - 1].date, locale)}`}
            </p>
            {venues.length > 0 && (
              <p className="text-foreground-muted">{venues.join(" · ")}</p>
            )}
            <p className="text-foreground-muted">
              {occurrences.length} {labels.events} · {days.length} {labels.days}
            </p>
          </div>
        )}
        <a
          href="#festival-programme"
          className={buttonVariants({ size: "lg" })}
        >
          {labels.programme}
          <ArrowDown aria-hidden="true" />
        </a>
      </div>
      {event.imageUrl && (
        <div className="relative aspect-square border-t-2 border-border bg-background lg:border-t-0 lg:border-l-2">
          <Image
            src={event.imageUrl}
            alt={event.imageAlt || event.imageCaption || event.title}
            fill
            preload
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-contain p-4 sm:p-6"
            unoptimized={shouldLoadImageDirectly(event.imageUrl)}
          />
        </div>
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
      className="scroll-mt-24 space-y-8"
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
                className="border-2 border-border bg-background px-4 py-3 font-heading transition-colors hover:bg-primary hover:text-primary-foreground focus-brutal"
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
