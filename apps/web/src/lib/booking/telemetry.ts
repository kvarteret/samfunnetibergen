import { randomUUID } from "node:crypto"
import { cookies } from "next/headers"
import { after } from "next/server"
import type { BookingAnalyticsOwner } from "./analytics-ownership"
import { z } from "zod"
import { CrescatSubmissionOutcomeUnknownError } from "@/lib/integrations/crescat/client"
import {
  emitOperationalEvent,
  prepareOperationalEvent,
  recordDiagnostic,
} from "@/lib/observability"

import { getPostHogClient, getBookingPostHogClient } from "@/lib/posthog-server"

/** Client-supplied retry correlation for a booking submission. The browser
 * reuses the UUID across retries of the same populated form and increments
 * the attempt counter, so a success with `submission_attempt > 1` measures a
 * successful user retry. */
export interface SubmissionTelemetry {
  bookingSubmissionId?: string
  submissionAttempt?: number
  analyticsDisabled?: boolean
}

export type BookingKind = "room" | "karaoke"
export type BookingOutcome =
  | "accepted"
  | "rejected"
  | "failed"
  | "outcome_unknown"

export function resolveBookingAnalyticsOwner(): BookingAnalyticsOwner {
  const mode = process.env.BOOKING_ANALYTICS_OWNERSHIP?.trim().toLowerCase()
  return mode === "server" || mode === "disabled" ? mode : "legacy"
}

export function parseBookingIdentity(raw: string | undefined): {
  distinctId: string
  identityScope: "aggregate" | "pseudonymous"
} {
  const fallback = {
    distinctId: "anonymous",
    identityScope: "aggregate" as const,
  }
  if (!raw || raw.length > 8192) return fallback
  try {
    const value = JSON.parse(raw) as { distinct_id?: unknown }
    // PostHog's current browser-generated IDs are UUIDs (including UUIDv7).
    const id = z.string().uuid().safeParse(value.distinct_id)
    return id.success
      ? { distinctId: id.data, identityScope: "pseudonymous" }
      : fallback
  } catch {
    return fallback
  }
}

async function getBookingIdentity() {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  if (!token) return parseBookingIdentity(undefined)
  const jar = await cookies()
  return parseBookingIdentity(jar.get(`ph_${token}_posthog`)?.value)
}

export async function emitBookingOutcome(input: {
  bookingKind: BookingKind
  outcome: BookingOutcome
  bookingSubmissionId: string
  analyticsOwner?: BookingAnalyticsOwner
  reasonCode?: string
  failureStage?: string
  durationMs?: number
  providerHttpStatus?: number
}): Promise<string> {
  const eventId = randomUUID()
  const occurredAt = new Date()
  const owner = input.analyticsOwner ?? resolveBookingAnalyticsOwner()
  const event = `booking.request.${input.outcome}`
  const occurrence = prepareOperationalEvent(event, {
    event_id: eventId,
    occurred_at: occurredAt.toISOString(),
    domain_event_id: eventId,
    source: "server",
    booking_kind: input.bookingKind,
    booking_submission_id: input.bookingSubmissionId,
    reason_code: input.reasonCode,
    failure_stage: input.failureStage,
    duration_ms: input.durationMs,
    provider_http_status: input.providerHttpStatus,
  })
  if (!occurrence) return eventId
  try {
    emitOperationalEvent(event, occurrence.fields)
  } catch {
    recordDiagnostic("sink_failure")
  }

  if (input.outcome === "accepted" && owner === "server") {
    try {
      after(async () => {
        try {
          const identity = await getBookingIdentity()
          const fields = occurrence.fields
          await getBookingPostHogClient().captureImmediate({
            distinctId: identity.distinctId,
            event:
              input.bookingKind === "room"
                ? "room_booking_submitted"
                : "karaoke_booking_submitted",
            uuid: eventId,
            timestamp: occurredAt,
            properties: {
              $process_person_profile: false,
              identity_scope: identity.identityScope,
              event_id: eventId,
              domain_event_id: eventId,
              schema_version: 1,
              source: "server",
              booking_kind: fields.booking_kind,
              booking_submission_id: fields.booking_submission_id,
              outcome: fields.outcome,
              duration_ms: fields.duration_ms,
              provider_http_status: fields.provider_http_status,
            },
          })
        } catch {
          recordDiagnostic("sink_failure")
        }
      })
    } catch {
      recordDiagnostic("sink_failure")
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
