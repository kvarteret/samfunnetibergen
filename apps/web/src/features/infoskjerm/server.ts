import "server-only"

import {
  fetchPublicEventSet,
  fetchPublicPromotedParentEvents,
} from "@/features/events/server/public-events"
import { selectScreenPromotions } from "./promotions"
import {
  getScreenDate,
  type ScreenEvent,
  type ScreenPromotion,
} from "./schedule"

export async function fetchScreenEvents(now: Date): Promise<{
  date: string
  events: ScreenEvent[]
  promotions: ScreenPromotion[]
}> {
  const date = getScreenDate(now)
  const [{ events, occurrences }, parents] = await Promise.all([
    fetchPublicEventSet({
      locale: "nb",
      from: date,
      to: null,
    }),
    fetchPublicPromotedParentEvents({ locale: "nb", from: date, to: null }),
  ])
  const todayOccurrences = occurrences.filter(
    occurrence => occurrence.schedule.startDate === date,
  )
  const todayIds = new Set(
    todayOccurrences.flatMap(({ event }) => [
      event._id,
      ...(event.parentEvent ? [event.parentEvent._id] : []),
    ]),
  )

  return {
    date,
    promotions: selectScreenPromotions([...events, ...parents], date, todayIds),
    events: todayOccurrences.map(({ id, event, schedule }) => ({
      id,
      title: event.title,
      startTime: schedule.startTime?.slice(0, 5) ?? null,
      endTime: schedule.endTime?.slice(0, 5) ?? null,
      startsAt: schedule.startsAt,
      endsAt: schedule.endsAt,
      room: event.room?.title || event.roomText || null,
      floor: event.room?.floor ?? null,
      organizer: event.organizerGroup?.name || event.organizerText || null,
      category: event.eventType?.name || null,
      imageUrl: event.imageUrl,
      cancelled: event.eventStatus === "cancelled",
      isFree: event.isFree,
    })),
  }
}
