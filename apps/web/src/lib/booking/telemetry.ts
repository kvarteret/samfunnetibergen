import { randomUUID } from "node:crypto"
import { cookies } from "next/headers"
import { z } from "zod"
import { CrescatSubmissionOutcomeUnknownError } from "@/lib/integrations/crescat/client"
import { emitOperationalEvent } from "@/lib/observability"
import { getPostHogDistinctIdFromCookie } from "@/lib/posthog/distinct-id"
import { getPostHogClient } from "@/lib/posthog-server"

/** Client-supplied retry correlation for a booking submission. The browser
 * reuses the UUID across retries of the same populated form and increments
 * the attempt counter, so a success with `submission_attempt > 1` measures a
 * successful user retry. */
export interface SubmissionTelemetry {
  bookingSubmissionId?: string
  submissionAttempt?: number
}

export type BookingKind = "room" | "karaoke"
export type BookingOutcome =
  | "accepted"
  | "rejected"
  | "failed"
  | "outcome_unknown"

const PSEUDONYMOUS_DISTINCT_ID = /^[A-Za-z0-9][A-Za-z0-9._:$-]{0,255}$/

function serverBookingAnalyticsEnabled(): boolean {
  return (
    process.env.BOOKING_ANALYTICS_OWNERSHIP?.trim().toLowerCase() === "server"
  )
}

async function getBookingDistinctId(): Promise<string> {
  try {
    const cookieStore = await cookies()
    const distinctId = getPostHogDistinctIdFromCookie(cookieStore.toString())
    return distinctId && PSEUDONYMOUS_DISTINCT_ID.test(distinctId)
      ? distinctId
      : "anonymous"
  } catch {
    return "anonymous"
  }
}

export async function emitBookingOutcome(input: {
  bookingKind: BookingKind
  outcome: BookingOutcome
  bookingSubmissionId: string
  reasonCode?: string
  failureStage?: string
  durationMs?: number
  providerHttpStatus?: number
}): Promise<string> {
  const eventId = randomUUID()
  const occurredAt = new Date()
  const event = `booking.request.${input.outcome}`
  const fields = {
    event_id: eventId,
    occurred_at: occurredAt.toISOString(),
    domain_event_id: eventId,
    schema_version: 1,
    source: "server",
    booking_kind: input.bookingKind,
    booking_submission_id: input.bookingSubmissionId,
    outcome: input.outcome,
    reason_code: input.reasonCode,
    failure_stage: input.failureStage,
    duration_ms: input.durationMs,
    provider_http_status: input.providerHttpStatus,
  }

  try {
    emitOperationalEvent(event, fields)
  } catch {
    // Logging must not change the booking response.
  }

  if (input.outcome === "accepted" && serverBookingAnalyticsEnabled()) {
    try {
      const distinctId = await getBookingDistinctId()
      const delivery = getPostHogClient()
        .captureImmediate({
          distinctId,
          event:
            input.bookingKind === "room"
              ? "room_booking_submitted"
              : "karaoke_booking_submitted",
          uuid: eventId,
          timestamp: occurredAt,
          properties: {
            $process_person_profile: false,
            event_id: eventId,
            domain_event_id: eventId,
            schema_version: 1,
            source: "server",
            booking_kind: input.bookingKind,
            booking_submission_id: input.bookingSubmissionId,
            outcome: "accepted",
            duration_ms: input.durationMs,
            provider_http_status: input.providerHttpStatus,
          },
        })
        .catch(() => undefined)
      let timeout: ReturnType<typeof setTimeout> | undefined
      try {
        await Promise.race([
          delivery,
          new Promise<void>(resolve => {
            timeout = setTimeout(resolve, 2_000)
          }),
        ])
      } finally {
        if (timeout !== undefined) clearTimeout(timeout)
      }
    } catch {
      // Analytics is a best-effort projection and must not alter booking success.
    }
  }

  return eventId
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
  if (failure instanceof CrescatSubmissionOutcomeUnknownError) {
    return "crescat_outcome_unknown"
  }
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
