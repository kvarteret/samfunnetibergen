import { submitKaraokeBooking } from "@/features/karaoke/actions/submit-karaoke-booking"
import type { KaraokeFormState } from "@/features/karaoke/domain/karaokeFormSchema"
import type { SubmissionTelemetry } from "@/lib/booking/telemetry"
import { isSameOriginRequest } from "@/lib/csrf"

// Stable karaoke-booking submit boundary. See ADR 010.

type KaraokeSubmitInput = KaraokeFormState & {
  honeypot?: string
} & SubmissionTelemetry

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ detail: "Forbidden" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ detail: "Invalid request body" }, { status: 400 })
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ detail: "Invalid request body" }, { status: 400 })
  }

  const result = await submitKaraokeBooking(body as KaraokeSubmitInput)
  return Response.json(result)
}
