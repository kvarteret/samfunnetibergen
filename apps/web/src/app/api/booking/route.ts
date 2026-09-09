import { submitRoomBooking } from "@/features/booking/actions/submit-room-booking"
import type { BookingFormState } from "@/features/booking/domain/bookingFormSchema"
import type { SubmissionTelemetry } from "@/lib/booking/telemetry"
import { isSameOriginRequest } from "@/lib/csrf"

// The room-booking submit boundary. It exists as a stable URL so a browser
// tab that loaded an older build still reaches the current deployment after a
// release, instead of posting a build-time server action id that no longer
// exists. See ADR 010.
//
// CSRF protection here replaces the same-origin check Next.js applies to
// server actions. Server actions reject cross-origin action POSTs for us;
// a plain route handler does not, so we re-implement that gate explicitly.

type BookingSubmitInput = BookingFormState & {
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

  // All validation, honeypot, rate-limit, availability, and Crescat delivery
  // behaviour lives in submitRoomBooking, which returns a serializable Result.
  const result = await submitRoomBooking(body as BookingSubmitInput)
  return Response.json(result)
}
