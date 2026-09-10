// Server-only availability lookup. The client fetch goes through the stable
// GET /api/karaoke/availability route handler; the karaoke submit module calls
// this directly server-side. Not a server action (see ADR 010).

import {
  type CresatBooking,
  fetchVenueCalendar,
} from "@/lib/integrations/crescat/calendar"

const KARAOKE_CALENDAR_SLUG =
  "studentersamfunnet-i-bergen-bookinkalender-karaoke"

export async function fetchKaraokeAvailability(
  start: string,
  end: string,
): Promise<CresatBooking[]> {
  return fetchVenueCalendar(KARAOKE_CALENDAR_SLUG, start, end)
}
