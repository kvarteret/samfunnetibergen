"use server"

import { randomUUID } from "node:crypto"
import { z } from "zod"

import {
  bookingRangeMs,
  durationHoursBetween,
  overlaps,
} from "@/features/booking/domain/availability"
import {
  type BookingFormState,
  bookingFormSchema,
} from "@/features/booking/domain/bookingFormSchema"
import { buildBookingPayload } from "@/features/booking/domain/formState"
import {
  calendarSlugForBookerType,
  fetchVenueCalendar,
} from "@/lib/integrations/crescat/calendar"
import { postEventRequest } from "@/lib/integrations/crescat/client"
import { addDaysDateOnly } from "@/lib/integrations/crescat/datetime"
import {
  buildRoomBooking,
  slugForBookerType,
} from "@/lib/integrations/crescat/room-booking"
import {
  currentTraceFields,
  emitOperationalEvent,
  withOperationalSpan,
} from "@/lib/observability"
import {
  hasOpeningHoursRows,
  isSlotAllowedForCombinedHours,
} from "@/lib/opening-hours"
import { isOptionalE164PhoneNumber } from "@/lib/phone-number"
import { getPostHogClient } from "@/lib/posthog-server"
import { err, ok, type Result } from "@/lib/result"
import { fetchBookableRooms, fetchHouseHours } from "@/lib/sanity/fetch"
import {
  captureSubmitFailure,
  GENERIC_SUBMIT_ERROR,
  getValidationDiagnostics,
  INVALID_PAYLOAD_ERROR,
  isSubmissionRateLimited,
  RATE_LIMIT_ERROR,
  TIME_PATTERN as timeRegex,
} from "@/lib/submission"

const payloadSchema = z.object({
  bookerType: z.enum(["intern", "ekstern", "studentorg"]),
  eventName: z.string().trim().min(1),
  roomId: z.number().int().positive().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  startTime: z.string().regex(timeRegex),
  endTime: z.string().regex(timeRegex),
  // One entry per booking day; empty string means no doors time set for that day.
  doorsTimes: z
    .array(z.union([z.literal(""), z.string().regex(timeRegex)]))
    .optional(),
  estimatedEndTimes: z
    .array(z.union([z.literal(""), z.string().regex(timeRegex)]))
    .optional(),
  description: z.string().trim().default(""),
  audienceCount: z.number().int().min(0),
  openOrClosed: z.enum(["Åpent", "Lukket"]),
  furniture: z.string().trim().min(1),
  techEquipment: z.string().trim().min(1),
  cateringWishes: z.string().trim().default(""),
  freeOrPaid: z.enum(["Gratis", "Betalt"]),
  ticketTypes: z.string().trim().default(""),
  // Paid events only: ticket sales channel.
  ticketSalesMethod: z.enum(["house", "ownTerminal"]).optional(),
  contactName: z.string().trim().min(1),
  contactEmail: z.string().trim().email(),
  contactPhone: z.string().trim().refine(isOptionalE164PhoneNumber).default(""),
  acceptTerms: z.literal(true),
  flexibleDates: z.boolean().optional(),
  // Ekstern / studentorg only
  onBehalfOfStudentOrg: z.boolean().optional(),
  studentOrgName: z.string().trim().optional(),
  invoiceAddress: z.string().trim().optional(),
  orgNumber: z.number().int().nullable().optional(),
  // New Crescat fields (2026-06-15 drift reconciliation)
  needsAmphi: z.boolean().optional(),
  barSelf: z.boolean().optional(),
  barKvarteret: z.boolean().optional(),
  alternativeDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  recurringDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  roomIds: z.array(z.number().int().positive()).min(1),
  keyContacts: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        role: z.string().trim().default(""),
        email: z.string().trim().email(),
        phone: z.string().trim().refine(isOptionalE164PhoneNumber).default(""),
        country_code: z.string().trim().default("+47"),
      }),
    )
    .optional(),
  contactRole: z.string().trim().optional(),
})

export type RoomBookingPayload = z.input<typeof payloadSchema>

function captureRoomBookingRejection(
  reason: "calendar_conflict" | "opening_hours",
  payload: z.output<typeof payloadSchema>,
  bookingSubmissionId: string,
): void {
  const traceFields = currentTraceFields()
  try {
    getPostHogClient().capture({
      distinctId: "anonymous",
      event: "room_booking_rejected",
      properties: {
        $process_person_profile: false,
        booking_submission_id: bookingSubmissionId,
        booker_type: payload.bookerType,
        end_date: payload.endDate ?? payload.startDate,
        end_time: payload.endTime,
        failure_reason: reason,
        form_id: "room_booking",
        room_ids: payload.roomIds,
        source: "server_validation",
        start_date: payload.startDate,
        start_time: payload.startTime,
        trace_id: traceFields.trace_id,
      },
    })
  } catch {
    // A rejected booking must still return useful feedback if analytics fails.
  }

  emitOperationalEvent("booking.rejected", {
    booking_submission_id: bookingSubmissionId,
    failure_stage: reason,
    outcome: "rejected",
  })
}

async function hasVenueCalendarConflict(
  payload: z.output<typeof payloadSchema>,
): Promise<boolean> {
  const endDate = payload.endDate ?? payload.startDate
  const bookings = await fetchVenueCalendar(
    calendarSlugForBookerType(payload.bookerType),
    payload.startDate,
    addDaysDateOnly(endDate, 1),
  )
  const [startMs, endMs] = bookingRangeMs(
    payload.startDate,
    payload.startTime,
    endDate,
    payload.endTime,
  )
  return bookings.some(booking => {
    if (!payload.roomIds.includes(booking.resourceId)) return false
    return overlaps(startMs, endMs, booking)
  })
}

async function isAllowedByOpeningHours(
  payload: z.output<typeof payloadSchema>,
): Promise<boolean> {
  const [houseHours, rooms] = await Promise.all([
    fetchHouseHours(),
    fetchBookableRooms(),
  ])
  // A Crescat-only room (not in Sanity) has no room-specific hours; validate it
  // against the house hours alone rather than rejecting it.
  const room = rooms.find(candidate =>
    payload.roomIds.includes(candidate.crescatRoomId),
  )

  const baseHours = houseHours?.operationsManagerHours ?? null
  const roomHours = room?.openingHours ?? null
  const hasConfiguredHours =
    hasOpeningHoursRows(baseHours) || hasOpeningHoursRows(roomHours)
  if (!hasConfiguredHours) return true

  return isSlotAllowedForCombinedHours(
    payload.startDate,
    payload.startTime,
    durationHoursBetween(payload.startTime, payload.endTime),
    baseHours,
    roomHours,
    houseHours?.houseClosedDates ?? [],
    houseHours?.vacationMode,
  )
}

export async function submitRoomBooking(
  input: BookingFormState & { honeypot?: string },
): Promise<Result<number>> {
  const bookingSubmissionId = randomUUID()
  return withOperationalSpan("booking.submit", async span => {
    span.setAttribute("booking_submission_id", bookingSubmissionId)
    return submitRoomBookingWithinSpan(input, bookingSubmissionId)
  })
}

async function submitRoomBookingWithinSpan(
  input: BookingFormState & { honeypot?: string },
  bookingSubmissionId: string,
): Promise<Result<number>> {
  const startedAt = performance.now()
  // Silently accept honeypot hits — nothing is forwarded to Crescat.
  if (input.honeypot?.trim()) return ok(-1)

  const formParsed = bookingFormSchema.safeParse(input)
  if (!formParsed.success) {
    captureSubmitFailure(
      "room_booking",
      new Error("Room booking form schema validation failed"),
      {
        source: "submit-room-booking",
        validation_stage: "server",
        failure_branch: "schema_validation_failed",
        form_id: "room_booking",
        booking_submission_id: bookingSubmissionId,
        ...getValidationDiagnostics(formParsed.error.issues),
      },
    )
    return err(INVALID_PAYLOAD_ERROR)
  }

  if (await isSubmissionRateLimited("submitRoomBooking")) {
    return err(RATE_LIMIT_ERROR)
  }

  const parsed = payloadSchema.safeParse(
    buildBookingPayload(formParsed.data, formParsed.data.selectedRoomIds),
  )
  if (!parsed.success) {
    captureSubmitFailure(
      "room_booking",
      new Error("Room booking normalized payload validation failed"),
      {
        source: "submit-room-booking",
        validation_stage: "server",
        failure_branch: "normalized_payload_mismatch",
        form_id: "room_booking",
        booking_submission_id: bookingSubmissionId,
        ...getValidationDiagnostics(parsed.error.issues),
      },
    )
    return err(INVALID_PAYLOAD_ERROR)
  }

  try {
    if (!(await isAllowedByOpeningHours(parsed.data))) {
      captureRoomBookingRejection(
        "opening_hours",
        parsed.data,
        bookingSubmissionId,
      )
      return err("Valgt tidspunkt er ikke tilgjengelig for dette rommet.")
    }

    if (await hasVenueCalendarConflict(parsed.data)) {
      captureRoomBookingRejection(
        "calendar_conflict",
        parsed.data,
        bookingSubmissionId,
      )
      return err(
        "Valgt tidsrom overlapper en eksisterende booking. Velg et annet tidspunkt.",
      )
    }

    const body = buildRoomBooking(parsed.data.bookerType, parsed.data)

    const result = await postEventRequest(
      slugForBookerType(parsed.data.bookerType),
      body,
    )

    if (result.ok) {
      try {
        const traceFields = currentTraceFields()
        emitOperationalEvent("booking.submitted", {
          booking_submission_id: bookingSubmissionId,
          crescat_event_id: result.value,
          duration_ms: Math.round(performance.now() - startedAt),
          outcome: "accepted",
        })
        getPostHogClient().capture({
          distinctId: "anonymous",
          event: "room_booking_submitted",
          properties: {
            $process_person_profile: false,
            booking_submission_id: bookingSubmissionId,
            booker_type: parsed.data.bookerType,
            room_id: parsed.data.roomIds[0],
            start_date: parsed.data.startDate,
            start_time: parsed.data.startTime,
            end_time: parsed.data.endTime,
            free_or_paid: parsed.data.freeOrPaid,
            open_or_closed: parsed.data.openOrClosed,
            crescat_event_id: result.value,
            trace_id: traceFields.trace_id,
          },
        })
      } catch {
        // A successful Crescat booking remains successful if analytics fails.
      }
      return result
    }

    captureSubmitFailure("room_booking", new Error(result.error), {
      source: "submit-room-booking",
      failure_branch: "crescat_request_failed",
      booking_submission_id: bookingSubmissionId,
      booker_type: parsed.data.bookerType,
      room_id: parsed.data.roomIds[0],
      start_date: parsed.data.startDate,
    })
    emitOperationalEvent("booking.failed", {
      booking_submission_id: bookingSubmissionId,
      duration_ms: Math.round(performance.now() - startedAt),
      failure_stage: "crescat",
      outcome: "failed",
    })
    return err(GENERIC_SUBMIT_ERROR)
  } catch (error) {
    captureSubmitFailure("room_booking", error, {
      source: "submit-room-booking",
      failure_branch: "unexpected_submission_failure",
      booking_submission_id: bookingSubmissionId,
      booker_type: parsed.data.bookerType,
      room_id: parsed.data.roomIds[0],
    })
    emitOperationalEvent("booking.failed", {
      booking_submission_id: bookingSubmissionId,
      duration_ms: Math.round(performance.now() - startedAt),
      failure_stage: "unexpected",
      outcome: "failed",
    })
    return err(GENERIC_SUBMIT_ERROR)
  }
}
