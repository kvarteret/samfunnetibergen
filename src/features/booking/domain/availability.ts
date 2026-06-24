import type { CresatBooking } from "@/lib/integrations/crescat/calendar"
import { rangesOverlap, timeToMinutes } from "@/lib/time"

const MINUTES_IN_DAY = 1440

// Absolute millisecond range for a slot, advancing the end past midnight when
// the end time is at or before the start time.
export function slotRangeMs(
  date: string,
  startTime: string,
  endTime: string,
): [number, number] {
  const baseMs = new Date(`${date}T00:00:00`).getTime()
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
    new Date(booking.start).getTime(),
    new Date(booking.end).getTime(),
  )
}

export function formatBookingTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatBookingDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
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
    new Date(`${startDate}T00:00:00`).getTime() +
    timeToMinutes(startTime) * 60_000
  const endMs =
    new Date(`${endDate}T00:00:00`).getTime() + timeToMinutes(endTime) * 60_000
  return [startMs, endMs]
}

// Human-readable range for a single conflicting booking, e.g.
// "17. jun 19:00–22:00" or "17. jun 22:00 – 18. jun 02:00" when it crosses
// midnight.
function formatConflictRange(booking: CresatBooking): string {
  const start = new Date(booking.start)
  const end = new Date(booking.end)
  const sameDay = start.toDateString() === end.toDateString()
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

  const startDateMs = new Date(`${startDate}T00:00:00`).getTime()
  const endStr = endDate || startDate
  const endDateMs = new Date(`${endStr}T23:59:59.999`).getTime()

  const selectedSet = new Set(selectedRoomIds)

  return bookings
    .filter(
      b =>
        selectedSet.has(b.resourceId) &&
        new Date(b.start).getTime() < endDateMs &&
        new Date(b.end).getTime() > startDateMs,
    )
    .map(b => {
      const startMin =
        Math.max(0, new Date(b.start).getTime() - startDateMs) / 60_000
      const endMin = (new Date(b.end).getTime() - startDateMs) / 60_000
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
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    )
    .map(formatConflictRange)
}
