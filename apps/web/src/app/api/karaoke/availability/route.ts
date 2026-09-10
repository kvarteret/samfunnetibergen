import { fetchKaraokeAvailability } from "@/features/karaoke/actions/karaoke-availability"
import { jsonGet } from "@/lib/route-helpers"

// Stable read endpoint for the karaoke availability calendar. See ADR 010.

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

  return jsonGet(
    () => fetchKaraokeAvailability(start, end),
    "Failed to load availability",
  )
}
