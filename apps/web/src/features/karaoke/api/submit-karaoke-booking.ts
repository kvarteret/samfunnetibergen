import type { SubmissionTelemetry } from "@/lib/booking/telemetry"
import type { Result } from "@/lib/result"
import { GENERIC_SUBMIT_ERROR } from "@/lib/submission-messages"
import type { KaraokeFormState } from "../domain/karaokeFormSchema"

// Client-side submit for the karaoke-booking form. It POSTs to the stable
// /api/karaoke route handler rather than calling a Next.js server action, so
// the endpoint survives redeploys while a tab stays open. See ADR 010.

const KARAOKE_ENDPOINT = "/api/karaoke"

type KaraokeSubmitInput = KaraokeFormState & {
  honeypot?: string
} & SubmissionTelemetry

export async function submitKaraokeBookingRequest(
  input: KaraokeSubmitInput,
): Promise<Result<number>> {
  let response: Response
  try {
    response = await fetch(KARAOKE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  } catch {
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
