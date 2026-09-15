import { TZDate } from "@date-fns/tz"
import { differenceInCalendarDays } from "date-fns"
import type { AppLocale } from "@/i18n/routing"
import type { EventDateEntry } from "../components/EventCard"

// ─── Formatters ──────────────────────────────────────────────────────────────

const EVENT_TIME_ZONE = "Europe/Oslo"
const longDateFormatter = new Intl.DateTimeFormat("nb-NO", {
  dateStyle: "long",
  timeZone: "Europe/Oslo",
})

function formatTimeRange(start: string, end?: string | null): string {
  if (end) return `${start}–${end}`
  return start
}

export interface PrimaryDateLabels {
  today: string
  tomorrow: string
  weekday: (date: Date) => string
}

export function formatHumanDate(
  date: EventDateEntry,
  labels: Pick<PrimaryDateLabels, "today" | "tomorrow" | "weekday">,
): string | null {
  const eventDate = TZDate.tz(EVENT_TIME_ZONE, date.startDate)
  const now = TZDate.tz(EVENT_TIME_ZONE, new Date())
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
): string {
  const eventDate = TZDate.tz(EVENT_TIME_ZONE, date.startDate)
  const timeRange = date.startTime
    ? formatTimeRange(date.startTime, date.endTime)
    : null

  const dayLabel =
    formatHumanDate(date, labels) ?? longDateFormatter.format(eventDate)

  return timeRange ? `${dayLabel}, ${timeRange}` : dayLabel
}

export interface RecurringLabels {
  daily: string
  weekly: string
  monthly: string
  generic: string
}

export function getRecurringLabel(
  rrule: string | null | undefined,
  labels: RecurringLabels,
): string | null {
  if (!rrule) return labels.generic
  const freq = rrule.match(/FREQ=(\w+)/)?.[1]?.toUpperCase()
  if (freq === "DAILY") return labels.daily
  if (freq === "WEEKLY") return labels.weekly
  if (freq === "MONTHLY") return labels.monthly
  return labels.generic
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
