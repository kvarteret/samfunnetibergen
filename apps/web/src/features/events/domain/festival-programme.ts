import {
  flattenPublicOccurrences,
  type PublicEvent,
  type PublicOccurrence,
  type PublicSchedule,
} from "./events"

export type FestivalDay = {
  date: string
  occurrences: PublicOccurrence[]
}

/** Keep every occurrence, ordered by local date and start time. */
export function groupFestivalProgramme(
  events: readonly PublicEvent[],
): FestivalDay[] {
  const days = new Map<string, PublicOccurrence[]>()
  for (const occurrence of flattenPublicOccurrences(events)) {
    const date = occurrence.schedule.startDate
    const day = days.get(date) ?? []
    day.push(occurrence)
    days.set(date, day)
  }
  return Array.from(days, ([date, occurrences]) => ({ date, occurrences }))
}

export function festivalDate(
  date: string,
  locale: string,
  long = false,
): string {
  return new Intl.DateTimeFormat(locale === "nb" ? "nb-NO" : "en-GB", {
    day: "numeric",
    month: long ? "long" : "short",
    ...(long ? { weekday: "long" as const } : {}),
    timeZone: "Europe/Oslo",
  }).format(new Date(`${date}T12:00:00Z`))
}

/** Calendar days from the first to the last programme day, inclusive. */
export function festivalRunDays(firstDate: string, lastDate: string): number {
  const toDay = (date: string) => Date.parse(`${date}T00:00:00Z`) / 86_400_000
  return toDay(lastDate) - toDay(firstDate) + 1
}

/**
 * A screening is over once its end time has passed. Without an end time it
 * counts as over only after its day has ended in Oslo.
 */
export function isOccurrenceOver(
  schedule: PublicSchedule,
  now: Date = new Date(),
): boolean {
  if (schedule.endsAt) return Date.parse(schedule.endsAt) <= now.getTime()
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
  }).format(now)
  return schedule.startDate < today
}
