import type { ImageFrame } from "@samfunnet/content-domain/image-frame"
export const EVENTS_PER_SCREEN = 4
export const REFRESH_INTERVAL_MS = 60 * 60 * 1_000
export const SCREEN_TIME_ZONE = "Europe/Oslo"

/** The screen keeps showing the previous day until this local hour. */
export const SCREEN_DAY_STARTS_AT_HOUR = 5
/** "Kun infoskjerm" arrangements show from this long before start... */
export const INFO_ONLY_LEAD_MS = 30 * 60 * 1_000
/** ...until this long after start. */
export const INFO_ONLY_TAIL_MS = 15 * 60 * 1_000

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SCREEN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
})

export function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T12:00:00Z`)
  shifted.setUTCDate(shifted.getUTCDate() + days)
  return shifted.toISOString().slice(0, 10)
}

export function getScreenDate(now: Date): string {
  const parts = dateFormatter.formatToParts(now)
  const part = (type: string) => parts.find(part => part.type === type)?.value
  const date = `${part("year")}-${part("month")}-${part("day")}`
  return Number(part("hour")) < SCREEN_DAY_STARTS_AT_HOUR
    ? shiftDate(date, -1)
    : date
}

export type ScreenEvent = {
  id: string
  title: string
  startTime: string | null
  endTime: string | null
  startsAt: string | null
  endsAt: string | null
  room: string | null
  floor: number | null
  organizer: string | null
  category: string | null
  imageUrl: string | null
  imageFrame?: ImageFrame | null
  cancelled: boolean
  isFree: boolean
}

/** A "Kun infoskjerm" arrangement: only title, room and start time. */
export type ScreenInfoOnlyEvent = {
  id: string
  title: string
  startTime: string
  startsAt: string
  room: string | null
  floor: number | null
}

export type ScreenPromotion = {
  id: string
  title: string
  date: string
  dateLabel: string
  room: string | null
  imageUrl: string | null
  imageFrame?: ImageFrame | null
}

export function isScreenEventExpired(event: ScreenEvent, now: Date): boolean {
  const expiresAt = event.endsAt ?? event.startsAt
  return expiresAt !== null && Date.parse(expiresAt) <= now.getTime()
}

/**
 * The screen shows a fixed number of events and moves through the day: the
 * window starts at the first event that has not ended. Once every event is
 * over, the last ones stay on screen, greyed out.
 */
export function selectScreenWindow(
  events: readonly ScreenEvent[],
  now: Date,
  size: number,
): { visibleEvents: ScreenEvent[]; laterCount: number } {
  const firstActive = events.findIndex(
    event => !isScreenEventExpired(event, now),
  )
  const start =
    firstActive === -1
      ? Math.max(0, events.length - size)
      : Math.min(firstActive, Math.max(0, events.length - size))
  const visibleEvents = events.slice(start, start + size)
  return {
    visibleEvents,
    laterCount: events.length - start - visibleEvents.length,
  }
}

/** Info-only arrangements from 30 minutes before start until 15 minutes after. */
export function selectInfoOnlyEvents(
  events: readonly ScreenInfoOnlyEvent[],
  now: Date,
): ScreenInfoOnlyEvent[] {
  const time = now.getTime()
  return events.filter(event => {
    const startsAt = Date.parse(event.startsAt)
    return (
      time >= startsAt - INFO_ONLY_LEAD_MS &&
      time <= startsAt + INFO_ONLY_TAIL_MS
    )
  })
}
