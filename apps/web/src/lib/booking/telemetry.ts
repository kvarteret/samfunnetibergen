import { randomUUID } from "node:crypto"
import { z } from "zod"

import { getPostHogClient } from "@/lib/posthog-server"

/** Client-supplied retry correlation for a booking submission. The browser
 * reuses the UUID across retries of the same populated form and increments
 * the attempt counter, so a success with `submission_attempt > 1` measures a
 * successful user retry. */
export interface SubmissionTelemetry {
  bookingSubmissionId?: string
  submissionAttempt?: number
}

export function resolveSubmissionTelemetry(input: SubmissionTelemetry): {
  bookingSubmissionId: string
  submissionAttempt: number
} {
  const bookingSubmissionId = z
    .string()
    .uuid()
    .safeParse(input.bookingSubmissionId)
  const submissionAttempt = z
    .number()
    .int()
    .min(1)
    .max(100)
    .safeParse(input.submissionAttempt)
  return {
    bookingSubmissionId: bookingSubmissionId.success
      ? bookingSubmissionId.data
      : randomUUID(),
    submissionAttempt: submissionAttempt.success ? submissionAttempt.data : 1,
  }
}

/** One PostHog event per failed booking submission, tagged with the failure
 * stage so dashboards can separate session, response, network, timeout, and
 * rate-limit failures without storing submitted values. */
export function captureBookingFailureEvent(
  event: "room_booking_submit_failed" | "karaoke_booking_submit_failed",
  failureStage: string,
  bookingSubmissionId: string,
  submissionAttempt: number,
): void {
  try {
    getPostHogClient().capture({
      distinctId: "anonymous",
      event,
      properties: {
        $process_person_profile: false,
        booking_submission_id: bookingSubmissionId,
        failure_stage: failureStage,
        submission_attempt: submissionAttempt,
      },
    })
  } catch {
    // User feedback must not depend on analytics availability.
  }
}

/** Categorize a booking failure into the stable `failure_stage` values the
 * review dashboards group on. A Crescat error message mentioning "sesjon" is a
 * session problem; otherwise a rejected response. */
export function classifyBookingFailureStage(failure: unknown): string {
  if (typeof failure === "string") {
    return failure.includes("sesjon") ? "crescat_session" : "crescat_response"
  }
  if (
    failure instanceof DOMException &&
    (failure.name === "AbortError" || failure.name === "TimeoutError")
  ) {
    return "crescat_timeout"
  }
  if (failure instanceof TypeError) return "network"
  return "unexpected"
}
