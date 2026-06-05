import type { CresatBooking } from "@/app/actions/room-availability"

const MINUTES_IN_DAY = 1440

function minutesOf(time: string): number {
    const [h, m] = time.split(":").map(Number)
    return h * 60 + m
}

// Absolute millisecond range for a slot, advancing the end past midnight when
// the end time is at or before the start time.
export function slotRangeMs(date: string, startTime: string, endTime: string): [number, number] {
    const baseMs = new Date(`${date}T00:00:00`).getTime()
    const startMs = baseMs + minutesOf(startTime) * 60_000
    const crossesMidnight = minutesOf(endTime) <= minutesOf(startTime)
    const endMs = baseMs + (minutesOf(endTime) + (crossesMidnight ? MINUTES_IN_DAY : 0)) * 60_000
    return [startMs, endMs]
}

export function overlaps(startMs: number, endMs: number, booking: CresatBooking): boolean {
    const bStart = new Date(booking.start).getTime()
    const bEnd = new Date(booking.end).getTime()
    return startMs < bEnd && endMs > bStart
}

export function formatBookingTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })
}

// Bookings for one Crescat room (resourceId) out of the day's calendar.
export function bookingsForRoom(bookings: CresatBooking[], crescatRoomId: number): CresatBooking[] {
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
