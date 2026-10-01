import { TZDate } from "@date-fns/tz"
import {
  type ClosedDate,
  formatOpeningHoursTime,
  isoDate,
  type OpeningHours,
  openingHoursStatusAt,
  openingRangesForDate,
  type VacationMode,
} from "@/lib/opening-hours"
import messages from "@/messages/nb.json"
import { SCREEN_TIME_ZONE } from "./schedule"

export type ScreenRoomHours = {
  rooms: { title: string; slug: string; hours: OpeningHours | null }[]
  closedDates?: ClosedDate[] | null
  vacationMode?: VacationMode | null
}

export function getScreenRoomHours(roomHours: ScreenRoomHours, now: Date) {
  const today = isoDate(now)
  const osloNow = TZDate.tz(SCREEN_TIME_ZONE, now)
  const currentMinute = osloNow.getHours() * 60 + osloNow.getMinutes()
  return roomHours.rooms.map(room => {
    const { isOpen, currentRange } = openingHoursStatusAt(
      now,
      room.hours,
      roomHours.closedDates,
      roomHours.vacationMode,
    )
    const ranges = openingRangesForDate(
      today,
      room.hours,
      roomHours.closedDates,
      roomHours.vacationMode,
    )
    const overnightRange =
      isOpen && currentRange && currentRange.startMin < 0 ? currentRange : null
    const displayRanges = overnightRange ? [overnightRange, ...ranges] : ranges
    const label = displayRanges.length
      ? displayRanges
          .map(
            range =>
              `${range.startMin > currentMinute ? `Åpner ${formatOpeningHoursTime(range.startMin)} · ` : ""}Stenger ${formatOpeningHoursTime(range.endMin)}`,
          )
          .join(", ")
      : messages.OpeningHours.closedShort
    return { title: room.title, slug: room.slug, isOpen, label }
  })
}
