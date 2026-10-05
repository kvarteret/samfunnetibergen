import {
  type ClosedDate,
  formatOpeningHoursTime,
  type OpeningHours,
  openingHoursStatusAt,
  type VacationMode,
} from "@/lib/opening-hours"
import messages from "@/messages/nb.json"

export type ScreenRoomHours = {
  rooms: { title: string; slug: string; hours: OpeningHours | null }[]
  closedDates?: ClosedDate[] | null
  vacationMode?: VacationMode | null
}

export function getScreenRoomHours(roomHours: ScreenRoomHours, now: Date) {
  return roomHours.rooms.map(room => {
    const { isOpen, currentRange, nextRange } = openingHoursStatusAt(
      now,
      room.hours,
      roomHours.closedDates,
      roomHours.vacationMode,
    )
    const label =
      isOpen && currentRange
        ? `Åpent. Stenger ${formatOpeningHoursTime(currentRange.endMin)}`
        : nextRange
          ? `Stengt. Åpner ${formatOpeningHoursTime(nextRange.startMin)}`
          : messages.OpeningHours.closedShort
    return { title: room.title, slug: room.slug, isOpen, label }
  })
}
