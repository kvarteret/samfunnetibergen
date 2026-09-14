import { differenceInCalendarDays, isToday, isTomorrow } from "date-fns"

import type { EventDateEntry } from "../components/EventCard"

// ─── Formatters ──────────────────────────────────────────────────────────────

const longDateFormatter = new Intl.DateTimeFormat("nb-NO", {
  dateStyle: "long",
  timeZone: "Europe/Oslo",
})

export function formatTimeRange(start: string, end?: string | null): string {
  if (end) return `kl. ${start}–${end}`
  return `kl. ${start}`
}

export interface PrimaryDateLabels {
  today: string
  tomorrow: string
  /** Returns "Om N dager" for the given number of days */
  inNDays: (n: number) => string
}

export function formatHumanDate(
  date: EventDateEntry,
  labels: Pick<PrimaryDateLabels, "today" | "tomorrow" | "inNDays">,
): string | null {
  const eventDate = new Date(`${date.startDate}T00:00:00`)
  const daysUntil = differenceInCalendarDays(eventDate, new Date())

  if (daysUntil < 0 || daysUntil > 7) return null
  if (isToday(eventDate)) return labels.today
  if (isTomorrow(eventDate)) return labels.tomorrow
  return labels.inNDays(daysUntil)
}

export function formatPrimaryDate(
  date: EventDateEntry,
  labels: PrimaryDateLabels,
): string {
  const eventDate = new Date(`${date.startDate}T00:00:00`)
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
