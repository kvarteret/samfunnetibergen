import {
  buildDateSequence,
  type ClosedDate,
  formatOpeningHoursTime,
  isoDate,
  isoWeekday,
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
  const [today, tomorrow] = buildDateSequence(isoDate(now), 2)
  return roomHours.rooms.map(room => {
    const { isOpen, currentRange, nextRange, nextDate } = openingHoursStatusAt(
      now,
      room.hours,
      roomHours.closedDates,
      roomHours.vacationMode,
    )
    const openingDay =
      !nextDate || nextDate === today
        ? ""
        : nextDate === tomorrow
          ? "i morgen "
          : `${["mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag", "søndag"][isoWeekday(nextDate) - 1]} `
    const label =
      isOpen && currentRange
        ? `Åpent. Stenger ${formatOpeningHoursTime(currentRange.endMin)}`
        : nextRange
          ? `Stengt. Åpner ${openingDay}${formatOpeningHoursTime(nextRange.startMin)}`
          : messages.OpeningHours.closedShort
    return { title: room.title, slug: room.slug, isOpen, label }
  })
}
