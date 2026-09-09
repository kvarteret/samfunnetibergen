import { submitRoomBooking } from "@/features/booking/actions/submit-room-booking"
import type { BookingFormState } from "@/features/booking/domain/bookingFormSchema"
import type { SubmissionTelemetry } from "@/lib/booking/telemetry"

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

/**
 * Reject requests whose Origin header names a different host than the request
 * itself, which is the standard same-origin gate for a state-changing JSON
 * endpoint.
 *
 * Browsers attach an Origin header to every POST. A cross-origin attacker
 * cannot forge it to our host (Origin is a forbidden header), so a mismatching
 * Origin is conclusive. Requests without an Origin (curl, server-to-server
 * callers, some non-browser clients) are not subject to browser CSRF and pass.
 * A cross-origin JSON POST would also be stopped earlier by the CORS preflight
 * because this route sends no CORS allow headers.
 */
function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin")
  if (!origin) return true

  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    return false
  }

  // Prefer the Host header (present in production and local dev). Fall back to
  // the request URL's host, which covers synthetic Request objects in tests.
  const requestHost = request.headers.get("host") ?? safeRequestUrlHost(request)
  return requestHost !== null && originHost === requestHost
}

function safeRequestUrlHost(request: Request): string | null {
  try {
    return new URL(request.url).host
  } catch {
    return null
  }
}
