import { getJson } from "@/lib/api-client"
import type { CresatBooking } from "@/lib/integrations/crescat/calendar"
import type { BookerType } from "@/lib/integrations/crescat/room-booking"

export async function getRoomAvailability(
  bookerType: BookerType,
  start: string,
  end: string,
): Promise<CresatBooking[]> {
  const params = new URLSearchParams({ bookerType, start, end })
  return getJson(`/api/booking/availability?${params}`)
}
