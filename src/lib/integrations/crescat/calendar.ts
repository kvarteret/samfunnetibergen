// Crescat exposes public, read-only venue calendars and resource lists under
// /venue-access/{calendarSlug}/{calendar,resources}. No CSRF/session needed —
// these are GET endpoints used by the public booking-calendar widget.

const BASE_URL = "https://app.crescat.io/venue-access"

const USER_AGENT =
  "Mozilla/5.0 (compatible; SamfunnetBot/1.0; +https://samfunnetibergen.no)"

// Slug of the standard venue booking calendar (covers the rooms bookable
// through the standard/ekstern form). The intern (dørger/borger/interne) form
// has its own calendar that is not yet exposed — see docs/adr/001.
export const VENUE_CALENDAR_SLUG = "studentersamfunnet-i-bergen-bookingkalender"

export interface CresatBooking {
  id: number
  resourceId: number
  event_id: number
  start: string
  end: string
  color: string
  title: string
  part_of_event: boolean
}

export interface CresatResource {
  id: number
  room_title: string | null
  title: string
}

export async function fetchVenueCalendar(
  calendarSlug: string,
  start: string,
  end: string,
): Promise<CresatBooking[]> {
  try {
    const url = `${BASE_URL}/${calendarSlug}/calendar?start=${start}&end=${end}`
    const res = await fetch(url, {
      headers: { accept: "application/json", "user-agent": USER_AGENT },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    return (await res.json()) as CresatBooking[]
  } catch {
    return []
  }
}

export async function fetchVenueResources(
  calendarSlug: string,
): Promise<CresatResource[]> {
  try {
    const url = `${BASE_URL}/${calendarSlug}/resources`
    const res = await fetch(url, {
      headers: { accept: "application/json", "user-agent": USER_AGENT },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    return (await res.json()) as CresatResource[]
  } catch {
    return []
  }
}
