import type { CresatBooking } from "@/lib/integrations/crescat/calendar"
import type { BookerType } from "@/lib/integrations/crescat/room-booking"

// Client-side read of the room availability calendar. Hits the stable GET
// /api/booking/availability endpoint so the fetch survives redeploys (ADR 010).
// Throws on failure so React Query can surface and retry the error.

export async function getRoomAvailability(
  bookerType: BookerType,
  start: string,
  end: string,
): Promise<CresatBooking[]> {
  const params = new URLSearchParams({ bookerType, start, end })
  const response = await fetch(`/api/booking/availability?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to load availability (${response.status})`)
  }
  return (await response.json()) as CresatBooking[]
}
