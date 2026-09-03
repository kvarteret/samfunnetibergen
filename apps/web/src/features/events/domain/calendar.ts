import { comparePublicOccurrences, type PublicOccurrence } from "./events"

export type CalendarOccurrence = PublicOccurrence

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

export function startOfCurrentWeek(date: string) {
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

/**
 * Group the shared, globally ordered occurrence stream into calendar days.
 * Month keys between the current week and last event month are retained so
 * users can see empty months before later events.
 */
export function buildCalendarMonths(
  sourceOccurrences: readonly PublicOccurrence[],
  today: string,
): CalendarMonth[] {
  const visibleFrom = startOfCurrentWeek(today)
  const occurrencesByDate = new Map<string, CalendarOccurrence[]>()
  let lastFutureDate: string | null = null

  const occurrences = sourceOccurrences
    .filter(occurrence => occurrence.schedule.startDate >= visibleFrom)
    .toSorted(comparePublicOccurrences)

  for (const occurrence of occurrences) {
    const date = occurrence.schedule.startDate
    const occurrences = occurrencesByDate.get(date) ?? []
    occurrences.push(occurrence)
    occurrencesByDate.set(date, occurrences)

    if (!lastFutureDate || date > lastFutureDate) {
      lastFutureDate = date
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
          comparePublicOccurrences,
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
