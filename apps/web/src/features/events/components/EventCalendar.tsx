"use client"

import { ArrowDown, CalendarDays } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { useTranslations } from "next-intl"

import { useEvents } from "@/features/events/context/EventsContext"
import { Link } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"
import { sanityImageUrl, shouldLoadImageDirectly } from "@/lib/sanity/image-url"
import { cn } from "@/lib/utils"
import {
  buildCalendarMonths,
  type CalendarDay,
  type CalendarMonth,
  type CalendarOccurrence,
} from "../domain/calendar"

const OSLO_TIME_ZONE = "Europe/Oslo"

function localeCode(locale: AppLocale) {
  return locale === "en" ? "en-GB" : "nb-NO"
}

function capitalize(value: string) {
  return value ? `${value[0]?.toUpperCase()}${value.slice(1)}` : value
}

function formatMonthLabel(month: CalendarMonth, locale: AppLocale) {
  const date = new Date(Date.UTC(month.year, month.month - 1, 15, 12))
  return capitalize(
    new Intl.DateTimeFormat(localeCode(locale), {
      month: "long",
      year: "numeric",
      timeZone: OSLO_TIME_ZONE,
    }).format(date),
  )
}

function formatDayLabel(date: string, locale: AppLocale) {
  const parsed = new Date(`${date}T12:00:00Z`)
  const weekday = new Intl.DateTimeFormat(localeCode(locale), {
    weekday: "long",
    timeZone: OSLO_TIME_ZONE,
  }).format(parsed)

  return `${capitalize(weekday)} ${date.slice(8, 10)}.${date.slice(5, 7)}.`
}

function formatTime(occurrence: CalendarOccurrence, prefix: string) {
  const { startTime, endTime } = occurrence.date
  if (!startTime) return null
  return endTime
    ? `${prefix} ${startTime}–${endTime}`
    : `${prefix} ${startTime}`
}

function CalendarEvent({ occurrence }: { occurrence: CalendarOccurrence }) {
  const t = useTranslations("EventCard")
  const { event } = occurrence
  const imageUrl = event.imageUrl
    ? sanityImageUrl(event.imageUrl, { height: 180, width: 280 })
    : null
  const time = formatTime(occurrence, t("timePrefix"))

  return (
    <Link
      className="group block w-full cursor-pointer overflow-hidden border border-border/40 bg-card focus-brutal"
      href={`/arrangementer/${event.slug}`}
    >
      {imageUrl ? (
        <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
          <Image
            alt={event.imageCaption ?? event.title}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            fill
            sizes="(max-width: 768px) 14rem, 16rem"
            src={imageUrl}
            unoptimized={shouldLoadImageDirectly(imageUrl)}
          />
        </div>
      ) : (
        <div className="flex aspect-4/3 items-center justify-center bg-muted p-3 text-center font-heading text-sm text-foreground-muted">
          <CalendarDays className="mr-1.5 size-4 shrink-0" aria-hidden />
          <span>{event.title}</span>
        </div>
      )}
      <div className="space-y-2 p-3">
        <p className="font-heading text-base leading-tight group-hover:underline group-hover:underline-offset-2">
          {event.title}
        </p>
        {time && (
          <p className="text-sm leading-tight text-foreground-muted">{time}</p>
        )}
        {event.eventStatus === "cancelled" && (
          <p className="font-heading text-xs uppercase tracking-widest text-destructive">
            {t("statusCancelled")}
          </p>
        )}
      </div>
    </Link>
  )
}

function CalendarDayCell({
  day,
  isShaded,
  locale,
}: {
  day: CalendarDay
  isShaded: boolean
  locale: AppLocale
}) {
  return (
    <article
      className={cn(
        "min-h-40 border border-primary/40",
        isShaded ? "bg-[var(--cream-100)]" : "bg-background",
      )}
    >
      <h3 className="bg-primary px-2 py-2 text-center font-heading text-sm leading-tight text-primary-foreground sm:text-base">
        {formatDayLabel(day.date, locale)}
      </h3>
      <div className="space-y-3">
        {day.occurrences.map(occurrence => (
          <CalendarEvent
            key={`${occurrence.event._id}-${occurrence.date._key}`}
            occurrence={occurrence}
          />
        ))}
      </div>
    </article>
  )
}

function MobileMonthCalendar({
  month,
  locale,
}: {
  month: CalendarMonth
  locale: AppLocale
}) {
  const eventDays = month.days.filter(day => day.occurrences.length > 0)

  return (
    <div className="border-y border-primary/40 md:hidden">
      <div className="grid grid-cols-1 gap-3 py-3">
        {eventDays.map((day, index) => (
          <CalendarDayCell
            day={day}
            isShaded={index % 2 === 1}
            key={day.date}
            locale={locale}
          />
        ))}
      </div>
    </div>
  )
}

function DesktopMonthCalendar({
  month,
  locale,
}: {
  month: CalendarMonth
  locale: AppLocale
}) {
  return (
    <div className="hidden overflow-x-auto border-y border-primary/40 md:block">
      <div className="grid min-w-[60rem] grid-cols-7 gap-3 bg-transparent py-3">
        {Array.from({ length: month.leadingEmptyDays }, (_, index) => (
          <div
            aria-hidden
            className="h-0 self-start bg-transparent"
            key={`empty-${index}`}
          />
        ))}
        {month.days.map((day, index) => (
          <CalendarDayCell
            day={day}
            isShaded={(month.leadingEmptyDays + index) % 2 === 1}
            key={day.date}
            locale={locale}
          />
        ))}
      </div>
    </div>
  )
}

function MonthCalendar({
  month,
  locale,
}: {
  month: CalendarMonth
  locale: AppLocale
}) {
  return (
    <>
      <MobileMonthCalendar locale={locale} month={month} />
      <DesktopMonthCalendar locale={locale} month={month} />
    </>
  )
}

export function EventCalendar({
  locale,
  today,
}: {
  locale: AppLocale
  today: string
}) {
  const t = useTranslations("EventsPage")
  const { filteredEvents } = useEvents()
  const months = buildCalendarMonths(filteredEvents, today)
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const [hasInteracted, setHasInteracted] = useState(false)
  const defaultMonths = months.map(month => month.key)
  const openMonths = hasInteracted ? selectedMonths : defaultMonths

  if (months.length === 0) {
    return (
      <div className="panel flex flex-col items-center gap-3 py-10 text-center">
        <CalendarDays className="size-8 text-primary" aria-hidden />
        <p>{t("empty")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="sr-only" aria-live="polite">
        {t("calendarMonthCount", { count: months.length })}
      </p>
      {months.map(month => {
        const monthLabel = formatMonthLabel(month, locale)
        const isOpen = openMonths.includes(month.key)

        return (
          <section
            className="overflow-hidden"
            id={`month-${month.key}`}
            key={month.key}
          >
            <button
              aria-controls={`month-content-${month.key}`}
              aria-expanded={isOpen}
              className="flex min-h-24 w-full cursor-pointer items-center justify-between gap-4 border-y border-primary/50 px-0 py-4 text-left focus-brutal sm:min-h-28 sm:py-5"
              onClick={() => {
                setHasInteracted(true)
                setSelectedMonths(
                  isOpen
                    ? openMonths.filter(key => key !== month.key)
                    : [...openMonths, month.key],
                )
              }}
              type="button"
            >
              <span className="min-w-0 font-heading text-3xl leading-none sm:text-5xl">
                {monthLabel}{" "}
                <span className="text-xl sm:text-2xl">
                  ({month.eventCount})
                </span>
              </span>
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-base",
                  isOpen && "rotate-180",
                )}
              >
                <ArrowDown className="size-6" aria-hidden />
              </span>
            </button>
            {isOpen && (
              <div id={`month-content-${month.key}`}>
                <MonthCalendar locale={locale} month={month} />
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
