import type { CresatBooking } from "@/lib/integrations/crescat/calendar"
import { crescatLocalDateTimeMs } from "@/lib/integrations/crescat/datetime"
import { rangesOverlap, timeToMinutes } from "@/lib/time"

const MINUTES_IN_DAY = 1440

// Absolute millisecond range for a slot, advancing the end past midnight when
// the end time is at or before the start time.
export function slotRangeMs(
  date: string,
  startTime: string,
  endTime: string,
): [number, number] {
  const baseMs = crescatLocalDateTimeMs(`${date}T00:00:00`)
  const startMs = baseMs + timeToMinutes(startTime) * 60_000
  const crossesMidnight = timeToMinutes(endTime) <= timeToMinutes(startTime)
  const endMs =
    baseMs +
    (timeToMinutes(endTime) + (crossesMidnight ? MINUTES_IN_DAY : 0)) * 60_000
  return [startMs, endMs]
}

export function overlaps(
  startMs: number,
  endMs: number,
  booking: CresatBooking,
): boolean {
  return rangesOverlap(
    startMs,
    endMs,
    crescatLocalDateTimeMs(booking.start),
    crescatLocalDateTimeMs(booking.end),
  )
}

export function formatBookingTime(iso: string): string {
  return new Date(crescatLocalDateTimeMs(iso)).toLocaleTimeString("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  })
}

function formatBookingDate(iso: string): string {
  return new Date(crescatLocalDateTimeMs(iso)).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
}

// Absolute millisecond range for a booking request, spanning multiple days
// when endDate differs from startDate (a multi-day rental).
export function bookingRangeMs(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
): [number, number] {
  if (!endDate || endDate === startDate) {
    return slotRangeMs(startDate, startTime, endTime)
  }
  const startMs =
    crescatLocalDateTimeMs(`${startDate}T00:00:00`) +
    timeToMinutes(startTime) * 60_000
  const endMs =
    crescatLocalDateTimeMs(`${endDate}T00:00:00`) +
    timeToMinutes(endTime) * 60_000
  return [startMs, endMs]
}

// Human-readable range for a single conflicting booking, e.g.
// "17. jun 19:00–22:00" or "17. jun 22:00 – 18. jun 02:00" when it crosses
// midnight.
function formatConflictRange(booking: CresatBooking): string {
  const sameDay = booking.start.slice(0, 10) === booking.end.slice(0, 10)
  return sameDay
    ? `${formatBookingDate(booking.start)} ${formatBookingTime(booking.start)}–${formatBookingTime(booking.end)}`
    : `${formatBookingDate(booking.start)} ${formatBookingTime(booking.start)} – ${formatBookingDate(booking.end)} ${formatBookingTime(booking.end)}`
}

// Hours between two HH:mm times, wrapping past midnight when end <= start.
export function durationHoursBetween(
  startTime: string,
  endTime: string,
): number {
  const diff = timeToMinutes(endTime) - timeToMinutes(startTime)
  return (diff <= 0 ? diff + MINUTES_IN_DAY : diff) / 60
}

// Elapsed booking hours across calendar dates. Date-only values are converted
// through UTC so daylight-saving changes do not turn a calendar day into 23
// or 25 billable hours.
export function durationHoursBetweenDates(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
): number {
  if (!endDate || endDate === startDate) {
    return durationHoursBetween(startTime, endTime)
  }

  const [startYear, startMonth, startDay] = startDate.split("-").map(Number)
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number)
  const calendarMinutes =
    (Date.UTC(endYear, endMonth - 1, endDay) -
      Date.UTC(startYear, startMonth - 1, startDay)) /
    60_000
  const timeMinutes = timeToMinutes(endTime) - timeToMinutes(startTime)

  return (calendarMinutes + timeMinutes) / 60
}

// Bookings for one Crescat room (resourceId) out of the day's calendar.
export function bookingsForRoom(
  bookings: CresatBooking[],
  crescatRoomId: number,
): CresatBooking[] {
  return bookings.filter(booking => booking.resourceId === crescatRoomId)
}

// Whether a given room is occupied for the chosen slot.
export function isRoomOccupied(
  bookings: CresatBooking[],
  crescatRoomId: number,
  date: string,
  startTime: string,
  endTime: string,
): boolean {
  if (!date) return false
  const [startMs, endMs] = slotRangeMs(date, startTime, endTime)
  return bookingsForRoom(bookings, crescatRoomId).some(booking =>
    overlaps(startMs, endMs, booking),
  )
}

/**
 * Occupied minute intervals for selected rooms within a date range,
 * expressed as minutes from midnight of `startDate`.
 * Each entry maps to a segment on the slider track that should be
 * shown as unavailable (striped).
 */
export function occupiedMinuteRanges(
  bookings: CresatBooking[],
  selectedRoomIds: number[],
  startDate: string,
  endDate: string,
): { startMin: number; endMin: number }[] {
  if (!startDate || !selectedRoomIds.length) return []

  const startDateMs = crescatLocalDateTimeMs(`${startDate}T00:00:00`)
  const endStr = endDate || startDate
  const endDateMs = crescatLocalDateTimeMs(`${endStr}T23:59:59`) + 1

  const selectedSet = new Set(selectedRoomIds)

  return bookings
    .filter(
      b =>
        selectedSet.has(b.resourceId) &&
        crescatLocalDateTimeMs(b.start) < endDateMs &&
        crescatLocalDateTimeMs(b.end) > startDateMs,
    )
    .map(b => {
      const startMin =
        Math.max(0, crescatLocalDateTimeMs(b.start) - startDateMs) / 60_000
      const endMin = (crescatLocalDateTimeMs(b.end) - startDateMs) / 60_000
      return { startMin, endMin }
    })
    .filter(r => r.endMin > 0)
}

// Every conflicting booking for a room over the requested range, formatted
// for display and sorted chronologically. The range may span multiple days
// when endDate differs from startDate.
export function findRoomConflicts(
  bookings: CresatBooking[],
  crescatRoomId: number,
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
): string[] {
  if (!startDate) return []
  const [startMs, endMs] = bookingRangeMs(
    startDate,
    startTime,
    endDate,
    endTime,
  )
  return bookingsForRoom(bookings, crescatRoomId)
    .filter(booking => overlaps(startMs, endMs, booking))
    .toSorted(
      (a, b) =>
        crescatLocalDateTimeMs(a.start) - crescatLocalDateTimeMs(b.start),
    )
    .map(formatConflictRange)
}
