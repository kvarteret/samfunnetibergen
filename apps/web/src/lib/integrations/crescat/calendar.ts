// Crescat exposes public, read-only venue calendars and resource lists under
// /venue-access/{calendarSlug}/{calendar,resources}. No CSRF/session needed —
// these are GET endpoints used by the public booking-calendar widget.

import {
  getHandledExceptionProperties,
  toPostHogException,
} from "@/lib/posthog/error-context"
import { getPostHogClient } from "@/lib/posthog-server"

const BASE_URL = "https://app.crescat.io/venue-access"

const USER_AGENT =
  "Mozilla/5.0 (compatible; SamfunnetBot/1.0; +https://samfunnetibergen.no)"

// Slug of the standard venue booking calendar (covers the rooms bookable
// through the standard/ekstern form).
export const VENUE_CALENDAR_SLUG = "studentersamfunnet-i-bergen-bookingkalender"

// Each room-booking form maps to a venue calendar. The calendar's /resources
// is the curated bookable-room set for that form, and /calendar returns its
// bookings (availability) keyed by the same resourceId. ekstern + studentorg
// book through the standard calendar; intern (dørger/borger/interne) books the
// privat calendar, which covers rooms the standard calendar does not list.
export const ROOM_CALENDAR_SLUGS = {
  standard: VENUE_CALENDAR_SLUG,
  privat: "studentersamfunnet-i-bergen-bookingkalender-privat",
} as const

export function calendarSlugForBookerType(
  bookerType: "ekstern" | "studentorg" | "intern",
): string {
  return bookerType === "intern"
    ? ROOM_CALENDAR_SLUGS.privat
    : ROOM_CALENDAR_SLUGS.standard
}

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

function captureCalendarFailure(
  error: unknown,
  properties: Record<string, number | string | undefined>,
): void {
  try {
    getPostHogClient().captureException(
      toPostHogException(error),
      "anonymous",
      getHandledExceptionProperties("server_request", {
        source: "crescat-calendar",
        integration: "crescat",
        operation: "calendar_fetch",
        ...properties,
      }),
    )
  } catch {
    // Availability behavior must not depend on telemetry availability.
  }
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
    if (!res.ok) {
      captureCalendarFailure(
        new Error(`Crescat calendar request failed with status ${res.status}`),
        {
          calendar_slug: calendarSlug,
          end_date: end,
          failure_branch: "calendar_http_error",
          http_status: res.status,
          start_date: start,
        },
      )
      return []
    }
    return (await res.json()) as CresatBooking[]
  } catch (error) {
    captureCalendarFailure(error, {
      calendar_slug: calendarSlug,
      end_date: end,
      failure_branch: "calendar_request_failed",
      start_date: start,
    })
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
