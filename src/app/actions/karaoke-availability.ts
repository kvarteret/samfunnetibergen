"use server"

import { type CresatBooking, fetchVenueCalendar } from "@/lib/integrations/crescat/calendar"

const KARAOKE_CALENDAR_SLUG = "studentersamfunnet-i-bergen-bookinkalender-karaoke"

export async function fetchKaraokeAvailability(
    start: string,
    end: string,
): Promise<CresatBooking[]> {
    return fetchVenueCalendar(KARAOKE_CALENDAR_SLUG, start, end)
}
