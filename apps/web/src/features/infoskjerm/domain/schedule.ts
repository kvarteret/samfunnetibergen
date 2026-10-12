import type { ImageFrame } from "@samfunnet/content-domain/image-frame"
export const EVENTS_PER_SCREEN = 4
export const REFRESH_INTERVAL_MS = 60 * 60 * 1_000
export const SCREEN_TIME_ZONE = "Europe/Oslo"

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SCREEN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

export function getScreenDate(now: Date): string {
  const parts = dateFormatter.formatToParts(now)
  const part = (type: string) => parts.find(part => part.type === type)?.value
  return `${part("year")}-${part("month")}-${part("day")}`
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
