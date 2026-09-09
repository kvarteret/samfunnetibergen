import { fetchBookableRoomsForBooker } from "@/features/booking/actions/bookable-rooms"
import type { BookerType } from "@/lib/integrations/crescat/room-booking"

// Stable read endpoint for the room picker. A browser tab that loaded an older
// build still reaches the current deployment through this URL after a release.
// See ADR 010. Read-only, so no same-origin CSRF gate is required.

const BOOKER_TYPES: readonly BookerType[] = ["ekstern", "studentorg", "intern"]

function isBookerType(value: string | null): value is BookerType {
  return value !== null && (BOOKER_TYPES as readonly string[]).includes(value)
}

export async function GET(request: Request) {
  const bookerType = new URL(request.url).searchParams.get("bookerType")
  if (!isBookerType(bookerType)) {
    return Response.json({ detail: "Invalid bookerType" }, { status: 400 })
  }

  try {
    const rooms = await fetchBookableRoomsForBooker(bookerType)
    return Response.json(rooms)
  } catch (error) {
    console.error("[booking/rooms] failed to load rooms:", error)
    return Response.json({ detail: "Failed to load rooms" }, { status: 500 })
  }
}
