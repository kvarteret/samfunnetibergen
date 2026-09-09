import { fetchKaraokeAvailability } from "@/features/karaoke/actions/karaoke-availability"

// Stable read endpoint for the karaoke availability calendar. See ADR 010.
// Read-only, so no same-origin CSRF gate is required.

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isDate(value: string | null): value is string {
  return value !== null && DATE_PATTERN.test(value)
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams
  const start = searchParams.get("start")
  const end = searchParams.get("end")

  if (!isDate(start) || !isDate(end)) {
    return Response.json({ detail: "Invalid start or end" }, { status: 400 })
  }

  try {
    const bookings = await fetchKaraokeAvailability(start, end)
    return Response.json(bookings)
  } catch (error) {
    console.error("[karaoke/availability] failed to load calendar:", error)
    return Response.json(
      { detail: "Failed to load availability" },
      { status: 500 },
    )
  }
}
