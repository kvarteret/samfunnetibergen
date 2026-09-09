import { postResultJson } from "@/lib/api-client"
import type { SubmissionTelemetry } from "@/lib/booking/telemetry"
import type { KaraokeFormState } from "../domain/karaokeFormSchema"

type KaraokeSubmitInput = KaraokeFormState & {
  honeypot?: string
} & SubmissionTelemetry

export function submitKaraokeBookingRequest(input: KaraokeSubmitInput) {
  return postResultJson<number>("/api/karaoke", input)
}
