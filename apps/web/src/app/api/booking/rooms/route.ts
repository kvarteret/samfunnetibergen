import { fetchBookableRoomsForBooker } from "@/features/booking/actions/bookable-rooms"
import type { BookerType } from "@/lib/integrations/crescat/room-booking"
import { jsonGet } from "@/lib/route-helpers"

// Stable read endpoint for the room picker. See ADR 010.

const BOOKER_TYPES: readonly BookerType[] = ["ekstern", "studentorg", "intern"]

function isBookerType(value: string | null): value is BookerType {
  return value !== null && (BOOKER_TYPES as readonly string[]).includes(value)
}

export async function GET(request: Request) {
  const bookerType = new URL(request.url).searchParams.get("bookerType")
  if (!isBookerType(bookerType)) {
    return Response.json({ detail: "Invalid bookerType" }, { status: 400 })
  }
  return jsonGet(
    () => fetchBookableRoomsForBooker(bookerType),
    "Failed to load rooms",
  )
}
