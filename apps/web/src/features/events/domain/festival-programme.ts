import {
  flattenPublicOccurrences,
  type PublicEvent,
  type PublicOccurrence,
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
