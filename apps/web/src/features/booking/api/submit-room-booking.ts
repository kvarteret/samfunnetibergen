import type { SubmissionTelemetry } from "@/lib/booking/telemetry"
import type { Result } from "@/lib/result"
import { GENERIC_SUBMIT_ERROR } from "@/lib/submission-messages"
import type { BookingFormState } from "../domain/bookingFormSchema"

// Client-side submit for the room-booking form. It POSTs to the stable
// /api/booking route handler rather than calling a Next.js server action, so
// the endpoint survives redeploys while a tab stays open. See ADR 010.

const BOOKING_ENDPOINT = "/api/booking"

type BookingSubmitInput = BookingFormState & {
  honeypot?: string
} & SubmissionTelemetry

export async function submitRoomBookingRequest(
  input: BookingSubmitInput,
): Promise<Result<number>> {
  let response: Response
  try {
    response = await fetch(BOOKING_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  } catch {
    // Network failure: the visitor can safely retry, so surface a generic
    // error rather than a thrown exception that skips form error handling.
    return { ok: false, error: GENERIC_SUBMIT_ERROR }
  }

  if (!response.ok) {
    return { ok: false, error: GENERIC_SUBMIT_ERROR }
  }

  try {
    return (await response.json()) as Result<number>
  } catch {
    return { ok: false, error: GENERIC_SUBMIT_ERROR }
  }
}
