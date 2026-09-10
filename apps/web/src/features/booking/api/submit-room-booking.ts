import { postResultJson } from "@/lib/api-client"
import type { SubmissionTelemetry } from "@/lib/booking/telemetry"
import type { BookingFormState } from "../domain/bookingFormSchema"

type BookingSubmitInput = BookingFormState & {
  honeypot?: string
} & SubmissionTelemetry

export function submitRoomBookingRequest(input: BookingSubmitInput) {
  return postResultJson<number>("/api/booking", input)
}
