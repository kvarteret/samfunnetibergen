"use server"

import {
    type CresatBooking,
    type CresatResource,
    fetchVenueCalendar,
    fetchVenueResources,
    VENUE_CALENDAR_SLUG,
} from "@/lib/integrations/crescat/calendar"

// Bookings across the standard venue calendar for a date range. Used to grey
// out / warn about already-booked intervals for the selected room.
export async function fetchRoomAvailability(start: string, end: string): Promise<CresatBooking[]> {
    return fetchVenueCalendar(VENUE_CALENDAR_SLUG, start, end)
}

// Live room list (id + title) from the standard venue calendar. Covers only
// the rooms exposed by that calendar — see docs/adr/001 for the gap.
export async function fetchVenueRoomResources(): Promise<CresatResource[]> {
    return fetchVenueResources(VENUE_CALENDAR_SLUG)
}
