import { fetchRoomAvailability } from "@/features/booking/actions/room-availability"
import type { BookerType } from "@/lib/integrations/crescat/room-booking"

// Stable read endpoint for the room availability calendar. See ADR 010.
// Read-only, so no same-origin CSRF gate is required.

const BOOKER_TYPES: readonly BookerType[] = ["ekstern", "studentorg", "intern"]
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isBookerType(value: string | null): value is BookerType {
  return value !== null && (BOOKER_TYPES as readonly string[]).includes(value)
}

function isDate(value: string | null): value is string {
  return value !== null && DATE_PATTERN.test(value)
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams
  const bookerType = searchParams.get("bookerType")
  const start = searchParams.get("start")
  const end = searchParams.get("end")

  if (!isBookerType(bookerType) || !isDate(start) || !isDate(end)) {
    return Response.json(
      { detail: "Invalid bookerType, start, or end" },
      { status: 400 },
    )
  }

  try {
    const bookings = await fetchRoomAvailability(bookerType, start, end)
    return Response.json(bookings)
  } catch (error) {
    console.error("[booking/availability] failed to load calendar:", error)
    return Response.json(
      { detail: "Failed to load availability" },
      { status: 500 },
    )
  }
}
