import {
  formatPrimaryDate,
  formatWeekday,
} from "@/features/events/domain/dates"
import type { PublicEvent } from "@/features/events/domain/events"
import {
  comparePromotedEvents,
  isPromotableEventKind,
} from "@/features/events/domain/promotedOrdering"
import messages from "@/messages/nb.json"
import type { ScreenPromotion } from "./schedule"

export function selectScreenPromotions(
  events: PublicEvent[],
  today: string,
  todayIds: ReadonlySet<string>,
): ScreenPromotion[] {
  const unique = new Map(events.map(event => [event._id, event]))
  return [...unique.values()]
    .filter(
      event =>
        event.isPromoted &&
        isPromotableEventKind(event.eventKind) &&
        event.eventStatus !== "cancelled" &&
        !todayIds.has(event._id) &&
        !event.dates.some(date => date.startDate === today) &&
        event.dates.some(date => date.startDate > today),
    )
    .sort((first, second) => {
      const placement =
        Number(second.promotedPlacement === "top") -
        Number(first.promotedPlacement === "top")
      return (
        placement ||
        comparePromotedEvents(first, second, today) ||
        first._id.localeCompare(second._id)
      )
    })
    .slice(0, 2)
    .map(event => {
      const date = [...event.dates]
        .filter(date => date.startDate > today)
        .sort(
          (first, second) =>
            first.startDate.localeCompare(second.startDate) ||
            (first.startTime ?? "99:99").localeCompare(
              second.startTime ?? "99:99",
            ),
        )[0]
      return {
        id: event._id,
        title: event.title,
        date: date.startDate,
        dateLabel: formatPrimaryDate(
          date,
          {
            today: messages.EventCard.today,
            tomorrow: messages.EventCard.tomorrow,
            weekday: date => formatWeekday(date, "nb"),
          },
          new Date(`${today}T12:00:00+01:00`),
        ),
        room: event.room?.title || event.roomText || null,
        imageUrl: event.imageUrl,
      }
    })
}
