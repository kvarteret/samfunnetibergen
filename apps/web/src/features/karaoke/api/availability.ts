import type { CresatBooking } from "@/lib/integrations/crescat/calendar"

// Client-side read of the karaoke availability calendar. Hits the stable GET
// /api/karaoke/availability endpoint so the fetch survives redeploys (ADR 010).
// Throws on failure so React Query can surface and retry the error.

export async function getKaraokeAvailability(
  start: string,
  end: string,
): Promise<CresatBooking[]> {
  const params = new URLSearchParams({ start, end })
  const response = await fetch(`/api/karaoke/availability?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to load availability (${response.status})`)
  }
  return (await response.json()) as CresatBooking[]
}
