"use server"

import { z } from "zod"

import {
  captureBookingFailureEvent,
  classifyBookingFailureStage,
  resolveSubmissionTelemetry,
  type SubmissionTelemetry,
} from "@/lib/booking/telemetry"
import { postEventRequest } from "@/lib/integrations/crescat/client"
import { addDaysDateOnly } from "@/lib/integrations/crescat/datetime"
import {
  buildKaraokeRequest,
  KARAOKE_SLUG,
} from "@/lib/integrations/crescat/karaoke"
import { isSlotAllowed } from "@/lib/opening-hours"
import { isOptionalE164PhoneNumber } from "@/lib/phone-number"
import { getPostHogClient } from "@/lib/posthog-server"
import { err, ok, type Result } from "@/lib/result"
import { fetchHouseHours } from "@/lib/sanity/fetch"
import {
  captureSubmitFailure,
  GENERIC_SUBMIT_ERROR,
  getValidationDiagnostics,
  INVALID_PAYLOAD_ERROR,
  isSubmissionRateLimited,
  RATE_LIMIT_ERROR,
  TIME_PATTERN as timeRegex,
} from "@/lib/submission"
import { slotOverlapsKaraokeBookings } from "../domain/availability"
import {
  buildKaraokePayload,
  calcKaraokePrice,
  deriveKaraokeState,
  KARAOKE_PRICING,
} from "../domain/formState"
import {
  type KaraokeFormState,
  karaokeFormSchema,
} from "../domain/karaokeFormSchema"
import { timeToMinutes } from "../domain/time"
import type { PriceType } from "../types"
import { fetchKaraokeAvailability } from "./karaoke-availability"

const karaokePayloadSchema = z.object({
  eventName: z.string().trim().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(timeRegex),
  duration: z.number().int().min(1).max(4),
  endTime: z.string().regex(timeRegex),
  description: z.string().trim().default(""),
  contactName: z.string().trim().min(1),
  contactEmail: z.string().trim().email(),
  contactPhone: z.string().trim().refine(isOptionalE164PhoneNumber).default(""),
  priceType: z.enum(["ordinær", "student", "frivillig"]),
  numberOfPeople: z.number().int().min(0),
  totalPrice: z.number().min(0),
  studentProofAccepted: z.boolean(),
  acceptTerms: z.literal(true),
})

async function hasKaraokeConflict(
  payload: z.output<typeof karaokePayloadSchema>,
): Promise<boolean> {
  const bookings = await fetchKaraokeAvailability(
    payload.startDate,
    addDaysDateOnly(payload.startDate, 1),
  )
  return slotOverlapsKaraokeBookings(
    payload.startDate,
    timeToMinutes(payload.startTime),
    payload.duration,
    bookings,
  )
}

function priceTypeLabel(pt: PriceType): string {
  switch (pt) {
    case "frivillig":
      return "Intern frivillig"
    case "ordinær":
      return "Ekstern"
    case "student":
      return "Ekstern (student)"
  }
}

function priceCalcDescription(
  priceType: PriceType,
  people: number,
  durationHours: number,
  totalPrice: number,
): string {
  if (people <= 0 || priceType === "frivillig") {
    return "Frivillig — gratis"
  }
  const p = KARAOKE_PRICING[priceType]
  return (
    `${p.perPerson} kr/pers × ${people} pers` +
    ` (min ${p.minPerHour} kr/t) × ${durationHours}t = ${totalPrice} kr`
  )
}

function enrichDescription(
  payload: z.output<typeof karaokePayloadSchema>,
  totalPrice: number,
): string {
  const priceCalc = priceCalcDescription(
    payload.priceType,
    payload.numberOfPeople,
    payload.duration,
    totalPrice,
  )
  const userText = payload.description.trim()
    ? `${payload.description.trim()}\n\n`
    : ""

  return (
    `${userText}EKSTRA, FRA BOOKING:\n` +
    `TYPE: ${priceTypeLabel(payload.priceType)}\n` +
    `PRIS: ${totalPrice} kr\n` +
    `PRISUTREGNING: ${priceCalc}\n` +
    `LOVER FREMVISE STUDENTBEVIS?: ${payload.studentProofAccepted ? "ja" : "nei"}\n` +
    `GODTATT BETINGELSER?: ${payload.acceptTerms ? "ja" : "nei"}`
  )
}

export async function submitKaraokeBooking(
  input: KaraokeFormState & { honeypot?: string } & SubmissionTelemetry,
): Promise<Result<number>> {
  const { bookingSubmissionId, submissionAttempt } =
    resolveSubmissionTelemetry(input)
  // Silently accept honeypot hits — nothing is forwarded to Crescat.
  if (input.honeypot?.trim()) return ok(-1)

  const formParsed = karaokeFormSchema.safeParse(input)
  if (!formParsed.success) {
    captureBookingFailureEvent(
      "karaoke_booking_submit_failed",
      "schema_validation",
      bookingSubmissionId,
      submissionAttempt,
    )
    captureSubmitFailure(
      "karaoke_booking",
      new Error("Karaoke form schema validation failed"),
      {
        source: "submit-karaoke-booking",
        validation_stage: "server",
        failure_branch: "schema_validation_failed",
        form_id: "karaoke_booking",
        ...getValidationDiagnostics(formParsed.error.issues),
      },
    )
    return err(INVALID_PAYLOAD_ERROR)
  }

  if (await isSubmissionRateLimited("submitKaraokeBooking")) {
    captureBookingFailureEvent(
      "karaoke_booking_submit_failed",
      "rate_limit",
      bookingSubmissionId,
      submissionAttempt,
    )
    return err(RATE_LIMIT_ERROR)
  }

  const parsed = karaokePayloadSchema.safeParse(
    buildKaraokePayload(formParsed.data, deriveKaraokeState(formParsed.data)),
  )
  if (!parsed.success) {
    captureBookingFailureEvent(
      "karaoke_booking_submit_failed",
      "normalized_payload",
      bookingSubmissionId,
      submissionAttempt,
    )
    captureSubmitFailure(
      "karaoke_booking",
      new Error("Karaoke normalized payload validation failed"),
      {
        source: "submit-karaoke-booking",
        validation_stage: "server",
        failure_branch: "normalized_payload_mismatch",
        form_id: "karaoke_booking",
        ...getValidationDiagnostics(parsed.error.issues),
      },
    )
    return err(INVALID_PAYLOAD_ERROR)
  }

  try {
    const houseHours = await fetchHouseHours()
    const slotAllowed = isSlotAllowed(
      parsed.data.startDate,
      parsed.data.startTime,
      parsed.data.duration,
      houseHours?.operationsManagerHours,
      houseHours?.houseClosedDates,
      houseHours?.vacationMode,
    )

    if (!slotAllowed) {
      return err("Valgt tidspunkt er ikke tilgjengelig for booking.")
    }

    if (await hasKaraokeConflict(parsed.data)) {
      return err(
        "Valgt tidsrom overlapper en eksisterende booking. Velg et annet tidspunkt.",
      )
    }

    // Recompute price server-side — never trust the client.
    const totalPrice = calcKaraokePrice(
      parsed.data.priceType,
      parsed.data.numberOfPeople,
      parsed.data.duration,
    )

    const body = buildKaraokeRequest({
      eventName: parsed.data.eventName,
      startDate: parsed.data.startDate,
      startTime: parsed.data.startTime,
      durationHours: parsed.data.duration,
      description: enrichDescription(parsed.data, totalPrice),
      contactName: parsed.data.contactName,
      contactEmail: parsed.data.contactEmail,
      contactPhone: parsed.data.contactPhone,
      numberOfPeople: parsed.data.numberOfPeople,
      priceType: parsed.data.priceType,
    })

    const result = await postEventRequest(KARAOKE_SLUG, body)

    if (result.ok) {
      try {
        getPostHogClient().capture({
          distinctId: "anonymous",
          event: "karaoke_booking_submitted",
          properties: {
            price_type: parsed.data.priceType,
            number_of_people: parsed.data.numberOfPeople,
            duration_hours: parsed.data.duration,
            total_price: totalPrice,
            start_date: parsed.data.startDate,
            crescat_http_status: result.value,
            booking_submission_id: bookingSubmissionId,
            submission_attempt: submissionAttempt,
          },
        })
      } catch {
        // A successful Crescat booking remains successful if analytics fails.
      }
      return result
    }

    captureSubmitFailure(
      "karaoke_booking",
      new Error("Crescat karaoke booking request failed"),
      {
        source: "submit-karaoke-booking",
        failure_branch: "crescat_request_failed",
        price_type: parsed.data.priceType,
        start_date: parsed.data.startDate,
      },
    )
    captureBookingFailureEvent(
      "karaoke_booking_submit_failed",
      classifyBookingFailureStage(result.error),
      bookingSubmissionId,
      submissionAttempt,
    )
    return err(GENERIC_SUBMIT_ERROR)
  } catch (error) {
    captureSubmitFailure(
      "karaoke_booking",
      new Error("Unexpected karaoke booking submission failure"),
      {
        source: "submit-karaoke-booking",
        failure_branch: "unexpected_submission_failure",
        price_type: parsed.data.priceType,
      },
    )
    captureBookingFailureEvent(
      "karaoke_booking_submit_failed",
      classifyBookingFailureStage(error),
      bookingSubmissionId,
      submissionAttempt,
    )
    return err(GENERIC_SUBMIT_ERROR)
  }
}
