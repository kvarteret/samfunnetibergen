import type { BookerType } from "@/lib/integrations/crescat/room-booking"
import type { BookingRoom } from "../types"

// Client-side read of the bookable room list. Hits the stable GET
// /api/booking/rooms endpoint so the fetch survives redeploys (see ADR 010).
// Throws on failure so React Query can surface and retry the error.

export async function getBookableRooms(
  bookerType: BookerType,
): Promise<BookingRoom[]> {
  const response = await fetch(
    `/api/booking/rooms?bookerType=${encodeURIComponent(bookerType)}`,
  )
  if (!response.ok) {
    throw new Error(`Failed to load rooms (${response.status})`)
  }
  return (await response.json()) as BookingRoom[]
}
