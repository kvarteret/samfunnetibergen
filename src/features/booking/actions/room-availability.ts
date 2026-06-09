"use server";

import {
  type CresatBooking,
  fetchVenueCalendar,
  VENUE_CALENDAR_SLUG,
} from "@/lib/integrations/crescat/calendar";

// Bookings across the standard venue calendar for a date range. Used to grey
// out / warn about already-booked intervals for the selected room.
export async function fetchRoomAvailability(
  start: string,
  end: string,
): Promise<CresatBooking[]> {
  return fetchVenueCalendar(VENUE_CALENDAR_SLUG, start, end);
}
