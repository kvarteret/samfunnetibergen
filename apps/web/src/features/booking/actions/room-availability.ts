// Server-only availability lookup. The client fetch goes through the stable
// GET /api/booking/availability route handler. Not a server action (ADR 010).

import {
  type CresatBooking,
  calendarSlugForBookerType,
  fetchVenueCalendar,
} from "@/lib/integrations/crescat/calendar"
import type { BookerType } from "../domain/formState"

// Bookings across the booker type's venue calendar for a date range. Used to
// grey out / warn about already-booked intervals for the selected room. The
// calendar depends on booker type: ekstern/studentorg use the standard
// calendar, intern uses the privat calendar.
export async function fetchRoomAvailability(
  bookerType: BookerType,
  start: string,
  end: string,
): Promise<CresatBooking[]> {
  return fetchVenueCalendar(calendarSlugForBookerType(bookerType), start, end)
}
