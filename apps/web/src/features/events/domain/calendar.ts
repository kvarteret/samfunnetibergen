import type { PublishedEvent } from "./eventUtils"
import type { EventDateEntry } from "../components/EventCard"

export type CalendarOccurrence = {
  event: PublishedEvent
  date: EventDateEntry
}

export type CalendarDay = {
  date: string
  occurrences: CalendarOccurrence[]
}

export type CalendarMonth = {
  key: string
  year: number
  month: number
  leadingEmptyDays: number
  days: CalendarDay[]
  eventCount: number
}

function monthKey(date: string) {
  return date.slice(0, 7)
}

function startOfCurrentWeek(date: string) {
  const [year, month, day] = date.split("-").map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  const mondayOffset = (parsed.getUTCDay() + 6) % 7
  parsed.setUTCDate(parsed.getUTCDate() - mondayOffset)

  return [
    parsed.getUTCFullYear(),
    String(parsed.getUTCMonth() + 1).padStart(2, "0"),
    String(parsed.getUTCDate()).padStart(2, "0"),
  ].join("-")
}

function nextMonth(key: string) {
  const [year, month] = key.split("-").map(Number)
  const nextYear = month === 12 ? year + 1 : year
  const nextMonthNumber = month === 12 ? 1 : month + 1
  return `${nextYear}-${String(nextMonthNumber).padStart(2, "0")}`
}

function monthKeysBetween(start: string, end: string) {
  const keys: string[] = []
  let current = start
  while (current <= end) {
    keys.push(current)
    current = nextMonth(current)
  }
  return keys
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function mondayBasedOffset(year: number, month: number) {
  const weekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  return (weekday + 6) % 7
}

function compareOccurrences(
  first: CalendarOccurrence,
  second: CalendarOccurrence,
) {
  const firstTime = first.date.startTime ?? "99:99"
  const secondTime = second.date.startTime ?? "99:99"
  return (
    `${firstTime}-${first.event.title}`.localeCompare(
      `${secondTime}-${second.event.title}`,
    ) || first.event._id.localeCompare(second.event._id)
  )
}

/**
 * Flatten event date entries into future calendar days. The source query keeps
 * rows with at least one future date but also returns their historical dates,
 * so the explicit Oslo date boundary belongs here at the presentation model
 * boundary. Month keys between the current and last event month are retained
 * so users can see empty months before later events.
 */
export function buildCalendarMonths(
  events: PublishedEvent[],
  today: string,
): CalendarMonth[] {
  const visibleFrom = startOfCurrentWeek(today)
  const occurrencesByDate = new Map<string, CalendarOccurrence[]>()
  let lastFutureDate: string | null = null

  for (const event of events) {
    for (const rawDate of event.dates ?? []) {
      if (!rawDate?.startDate || rawDate.startDate < visibleFrom) continue

      const date: EventDateEntry = {
        _key: rawDate._key,
        startDate: rawDate.startDate,
        startTime: rawDate.startTime ?? null,
        endTime: rawDate.endTime ?? null,
      }
      const occurrence = { event, date }
      const occurrences = occurrencesByDate.get(date.startDate) ?? []
      occurrences.push(occurrence)
      occurrencesByDate.set(date.startDate, occurrences)

      if (!lastFutureDate || date.startDate > lastFutureDate) {
        lastFutureDate = date.startDate
      }
    }
  }

  if (!lastFutureDate) return []

  const startMonth = monthKey(visibleFrom)
  const endMonth = monthKey(lastFutureDate)

  return monthKeysBetween(startMonth, endMonth).map(key => {
    const [year, month] = key.split("-").map(Number)
    const dayCount = daysInMonth(year, month)
    const firstDay = key === startMonth ? Number(visibleFrom.slice(8, 10)) : 1
    const days = Array.from({ length: dayCount - firstDay + 1 }, (_, index) => {
      const date = `${key}-${String(firstDay + index).padStart(2, "0")}`
      return {
        date,
        occurrences: (occurrencesByDate.get(date) ?? []).sort(
          compareOccurrences,
        ),
      }
    })

    return {
      key,
      year,
      month,
      leadingEmptyDays: key === startMonth ? 0 : mondayBasedOffset(year, month),
      days,
      eventCount: days.reduce(
        (count, day) => count + day.occurrences.length,
        0,
      ),
    }
  })
}
