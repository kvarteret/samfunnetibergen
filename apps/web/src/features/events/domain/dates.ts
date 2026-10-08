import { TZDate } from "@date-fns/tz"
import { differenceInCalendarDays } from "date-fns"
import type { AppLocale } from "@/i18n/routing"
import type { EventDateEntry } from "../components/EventCard"

// ─── Formatters ──────────────────────────────────────────────────────────────

const EVENT_TIME_ZONE = "Europe/Oslo"

function formatTimeRange(start: string, end?: string | null): string {
  if (end) return `${start}–${end}`
  return start
}

export interface PrimaryDateLabels {
  locale?: AppLocale
  today: string
  tomorrow: string
  weekday: (date: Date) => string
}

export function formatHumanDate(
  date: EventDateEntry,
  labels: Pick<PrimaryDateLabels, "today" | "tomorrow" | "weekday">,
  referenceNow: Date = new Date(),
): string | null {
  const eventDate = TZDate.tz(EVENT_TIME_ZONE, date.startDate)
  const now = TZDate.tz(EVENT_TIME_ZONE, referenceNow)
  const daysUntil = differenceInCalendarDays(eventDate, now)

  if (daysUntil < 0 || daysUntil > 7) return null
  if (daysUntil === 0) return labels.today
  if (daysUntil === 1) return labels.tomorrow
  return labels.weekday(eventDate)
}

export function formatWeekday(date: Date, locale: AppLocale): string {
  const weekday = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nb-NO", {
    timeZone: "Europe/Oslo",
    weekday: "long",
  }).format(date)

  return weekday.charAt(0).toLocaleUpperCase(locale) + weekday.slice(1)
}

export function formatPrimaryDate(
  date: EventDateEntry,
  labels: PrimaryDateLabels,
  referenceNow: Date = new Date(),
): string {
  const eventDate = TZDate.tz(EVENT_TIME_ZONE, date.startDate)
  const timeRange = date.startTime
    ? formatTimeRange(date.startTime, date.endTime)
    : null

  const dayLabel =
    formatHumanDate(date, labels, referenceNow) ??
    new Intl.DateTimeFormat(labels.locale === "en" ? "en-GB" : "nb-NO", {
      dateStyle: "long",
      timeZone: EVENT_TIME_ZONE,
    }).format(eventDate)

  return timeRange ? `${dayLabel}, ${timeRange}` : dayLabel
}

export interface RecurringLabels {
  daily: string
  weekly: string
  monthly: string
  generic: string
  /** "Hver onsdag" when a weekly series has a known weekday. */
  weeklyOn?: (weekday: string) => string
}

export function getRecurringLabel(
  rrule: string | null | undefined,
  labels: RecurringLabels,
  weekday?: string | null,
): string | null {
  if (!rrule) return labels.generic
  const freq = rrule.match(/FREQ=(\w+)/)?.[1]?.toUpperCase()
  const interval = Number(rrule.match(/INTERVAL=(\d+)/)?.[1] ?? 1)
  if (interval > 1) return labels.generic
  if (freq === "DAILY") return labels.daily
  if (freq === "WEEKLY") {
    return weekday && labels.weeklyOn ? labels.weeklyOn(weekday) : labels.weekly
  }
  if (freq === "MONTHLY") return labels.monthly
  return labels.generic
}

export interface FestivalRunLabels extends PrimaryDateLabels {
  days: (count: number) => string
}

/**
 * A festival parent spans every child occurrence: "Torsdag, 12:30 · 8 dager".
 * The end time belongs to the first screening, not the festival, so it is
 * dropped from the start label.
 */
export function formatFestivalRun(
  dates: readonly EventDateEntry[],
  labels: FestivalRunLabels,
  referenceNow: Date = new Date(),
): string | null {
  const first = dates[0]
  if (!first) return null
  const last = dates[dates.length - 1]
  const start = formatPrimaryDate(
    { ...first, endTime: null },
    labels,
    referenceNow,
  )
  const days =
    differenceInCalendarDays(
      TZDate.tz(EVENT_TIME_ZONE, last.startDate),
      TZDate.tz(EVENT_TIME_ZONE, first.startDate),
    ) + 1
  return days > 1 ? `${start} · ${labels.days(days)}` : start
}

// ─── Date computation ────────────────────────────────────────────────────────

// ADR 005: public reads never expand recurrence rules. Recurring series are
// materialized as concrete child documents; every event's dates are stored.
export function computeAllDates(
  dates: EventDateEntry[],
  todayStr: string,
): EventDateEntry[] {
  const seedDate = dates[0]
  const futureDates = dates.filter(d => d.startDate >= todayStr)
  if (futureDates.length > 0) return futureDates

  return seedDate ? [seedDate] : []
}

// ─── Card labels ─────────────────────────────────────────────────────────────

export interface CardDateLabels extends FestivalRunLabels {
  recurring: RecurringLabels
  events: (count: number) => string
  weekdayName: (date: Date) => string
  weeklyDate?: (weekday: string) => string
}

type CardDateEvent = {
  eventKind?: string | null
  isRecurring?: boolean | null
  rrule?: string | null
  dates: readonly EventDateEntry[]
  parentEvent?: { rrule?: string | null } | null
}

/** The date fields every event card surface precomputes on the server. */
export function buildCardDateLabels(
  event: CardDateEvent,
  todayStr: string,
  labels: CardDateLabels,
  referenceNow: Date = new Date(),
) {
  const dates: EventDateEntry[] = event.dates.map(d => ({
    _key: d._key,
    startDate: d.startDate,
    startTime: d.startTime ?? null,
    endTime: d.endTime ?? null,
  }))
  const resolvedDates = computeAllDates(dates, todayStr)
  const primaryDate = resolvedDates[0]
  const isFestival = event.eventKind === "festivalParent"
  const datedPrimaryLabel = !primaryDate
    ? null
    : isFestival
      ? formatFestivalRun(resolvedDates, labels, referenceNow)
      : formatPrimaryDate(primaryDate, labels, referenceNow)
  const seriesRule =
    event.eventKind === "seriesInstance"
      ? (event.parentEvent?.rrule ?? event.rrule)
      : event.eventKind === "seriesParent" || event.isRecurring
        ? event.rrule
        : undefined
  const recurringLabel =
    seriesRule === undefined
      ? null
      : getRecurringLabel(
          seriesRule,
          labels.recurring,
          primaryDate
            ? labels.weekdayName(
                TZDate.tz(EVENT_TIME_ZONE, primaryDate.startDate),
              )
            : null,
        )

  const weeklyDateLabel =
    primaryDate &&
    labels.weeklyDate &&
    seriesRule?.match(/FREQ=WEEKLY(?:;|$)/) &&
    Number(seriesRule.match(/INTERVAL=(\d+)/)?.[1] ?? 1) === 1
      ? labels.weeklyDate(
          labels.weekdayName(TZDate.tz(EVENT_TIME_ZONE, primaryDate.startDate)),
        )
      : null
  const primaryDateLabel = weeklyDateLabel
    ? primaryDate.startTime
      ? `${weeklyDateLabel}, ${formatTimeRange(primaryDate.startTime, primaryDate.endTime)}`
      : weeklyDateLabel
    : datedPrimaryLabel

  return {
    dates,
    resolvedDates,
    primaryDateLabel,
    recurringLabel: weeklyDateLabel ? null : recurringLabel,
    recurringDetailLabel: recurringLabel,
    programmeLabel: isFestival ? labels.events(resolvedDates.length) : null,
  }
}
