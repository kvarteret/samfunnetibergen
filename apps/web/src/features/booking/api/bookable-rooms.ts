import { getJson } from "@/lib/api-client"
import type { BookerType } from "@/lib/integrations/crescat/room-booking"
import type { BookingRoom } from "../types"

export async function getBookableRooms(
  bookerType: BookerType,
): Promise<BookingRoom[]> {
  return getJson(
    `/api/booking/rooms?bookerType=${encodeURIComponent(bookerType)}`,
  )
}
