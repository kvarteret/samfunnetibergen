import { TZDate } from "@date-fns/tz"
import {
  addDays,
  format,
  getISOWeek,
  getISOWeekYear,
  startOfWeek,
} from "date-fns"
import { publicCollectionResponseSchema } from "@/features/events/api/schemas"
import { isValidPublicDate } from "@/features/events/domain/events"

export const OSLO = "Europe/Oslo"
export type Week = { from: string; to: string; number: number; year: number }
export type WeeklyEvent = {
  id: string
  date: string
  title: string
  description: string
  locationTime: string
  imageUrl: string | null
  url: string
}
export type DayPage = { heading: string; events: WeeklyEvent[] }

export function weekFor(now = new Date(), monday?: string): Week {
  if (monday && !isValidPublicDate(monday)) throw new Error("Invalid week date")
  const date = monday
    ? new TZDate(`${monday}T12:00:00`, OSLO)
    : addDays(startOfWeek(new TZDate(now, OSLO), { weekStartsOn: 1 }), 7)
  if (date.getDay() !== 1) throw new Error("Week date must be a Monday")
  return {
    from: format(date, "yyyy-MM-dd"),
    to: format(addDays(date, 6), "yyyy-MM-dd"),
    number: getISOWeek(date),
    year: getISOWeekYear(date),
  }
}

// A delayed runner may start later on Sunday; never generate before 18:00.
export function scheduleDue(now = new Date()): boolean {
  const local = new TZDate(now, OSLO)
  return local.getDay() === 0 && local.getHours() >= 18
}

export async function readWeek(
  week: Week,
  requestFetch: typeof fetch = fetch,
): Promise<WeeklyEvent[]> {
  const url = new URL("https://www.samfunnetibergen.no/api/v1/events")
  url.search = new URLSearchParams({
    locale: "nb",
    from: week.from,
    to: week.to,
  }).toString()
  const response = await requestFetch(url, {
    signal: AbortSignal.timeout(30000),
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`Events API HTTP ${response.status}`)
  const body = publicCollectionResponseSchema.parse(await response.json())
  if (
    body.meta.locale !== "nb" ||
    body.meta.from !== week.from ||
    body.meta.to !== week.to
  )
    throw new Error("Events API returned the wrong week")
  const seen = new Set<string>()
  return body.data
    .filter(item => item.event.status === "scheduled")
    .map(({ id, event, schedule }) => {
      const date =
        schedule.kind === "timed"
          ? format(new TZDate(schedule.startsAt, OSLO), "yyyy-MM-dd")
          : schedule.date
      const time =
        schedule.kind === "timed"
          ? format(new TZDate(schedule.startsAt, OSLO), "HH:mm")
          : "Tid ikke oppgitt"
      if (
        !event.title.trim() ||
        event.title.startsWith("[Mangler") ||
        date < week.from ||
        date > week.to ||
        seen.has(id)
      )
        throw new Error("Events API returned invalid or duplicate events")
      seen.add(id)
      return {
        id,
        date,
        title: event.title,
        description: event.description.text.slice(0, 6000),
        locationTime: `${event.location.name} – ${time}`,
        imageUrl: event.image?.url ?? null,
        url: event.links.website,
      }
    })
}

export function planPages(events: WeeklyEvent[]): DayPage[] {
  const days = new Map<string, WeeklyEvent[]>()
  for (const event of events) {
    const day = days.get(event.date) ?? []
    day.push(event)
    days.set(event.date, day)
  }
  return [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([date, day]) => {
      const heading = new Intl.DateTimeFormat("nb-NO", {
        timeZone: OSLO,
        weekday: "long",
      })
        .format(new TZDate(`${date}T12:00:00`, OSLO))
        .toLocaleUpperCase("nb-NO")
      const pages: DayPage[] = []
      for (let i = 0; i < day.length; i += 2)
        pages.push({ heading, events: day.slice(i, i + 2) })
      return pages
    })
}
