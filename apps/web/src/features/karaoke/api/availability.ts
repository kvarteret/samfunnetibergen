import { getJson } from "@/lib/api-client"
import type { CresatBooking } from "@/lib/integrations/crescat/calendar"

export async function getKaraokeAvailability(
  start: string,
  end: string,
): Promise<CresatBooking[]> {
  const params = new URLSearchParams({ start, end })
  return getJson(`/api/karaoke/availability?${params}`)
}
