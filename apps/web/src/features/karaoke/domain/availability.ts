import type { CresatBooking } from "@/lib/integrations/crescat/calendar"
import { crescatLocalDateTimeMs } from "@/lib/integrations/crescat/datetime"
import {
  type ClosedDate,
  type OpeningHours,
  slotRangesForDate,
  type VacationMode,
} from "@/lib/opening-hours"
import { rangesOverlap } from "@/lib/time"

export const KARAOKE_DATE_COUNT = 60

export function slotOverlapsKaraokeBookings(
  date: string,
  slotStartMin: number,
  durationHours: number,
  bookings: CresatBooking[],
): boolean {
  const baseDateMs = crescatLocalDateTimeMs(date + "T00:00:00")
  const slotStartMs = baseDateMs + slotStartMin * 60 * 1000
  const slotEndMs = slotStartMs + durationHours * 3600 * 1000
  return bookings.some(booking =>
    rangesOverlap(
      slotStartMs,
      slotEndMs,
      crescatLocalDateTimeMs(booking.start),
      crescatLocalDateTimeMs(booking.end),
    ),
  )
}

export function dateHasKaraokeSlot(
  date: string,
  durationHours: number,
  bookings: CresatBooking[],
  operationsManagerHours?: OpeningHours | null,
  houseClosedDates?: ClosedDate[] | null,
  vacationMode?: VacationMode | null,
): boolean {
  return slotRangesForDate(
    date,
    durationHours,
    operationsManagerHours,
    houseClosedDates,
    vacationMode,
  ).some(
    slotMin =>
      !slotOverlapsKaraokeBookings(date, slotMin, durationHours, bookings),
  )
}
