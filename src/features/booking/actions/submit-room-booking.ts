"use server"

import { z } from "zod"

const osloDateTimePartsFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Oslo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
})

import {
  calendarSlugForBookerType,
  fetchVenueCalendar,
} from "@/lib/integrations/crescat/calendar"
import { postEventRequest } from "@/lib/integrations/crescat/client"
import {
  addDaysDateOnly,
  resolveEndDateTime,
  toDateTime,
} from "@/lib/integrations/crescat/datetime"
import {
  buildRoomBooking,
  slugForBookerType,
} from "@/lib/integrations/crescat/room-booking"
import { durationHoursBetween } from "@/features/booking/domain/availability"
import {
  hasOpeningHoursRows,
  isSlotAllowedForCombinedHours,
} from "@/lib/opening-hours"
import { getPostHogClient } from "@/lib/posthog-server"
import { err, ok, type Result } from "@/lib/result"
import { fetchBookableRooms, fetchHouseHours } from "@/lib/sanity/fetch"
import {
  captureSubmitFailure,
  GENERIC_SUBMIT_ERROR,
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
  contactPhone: z.string().trim().default(""),
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
        phone: z.string().trim().default(""),
        country_code: z.string().trim().default("+47"),
      }),
    )
    .optional(),
  contactRole: z.string().trim().optional(),
})

export type RoomBookingPayload = z.input<typeof payloadSchema>

function formatOsloDateTime(value: string): string {
  const parts = osloDateTimePartsFormatter.formatToParts(new Date(value))
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(item => item.type === type)?.value ?? ""
  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}:${part("second")}`
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
  const start = toDateTime(payload.startDate, payload.startTime)
  const end = resolveEndDateTime(endDate, payload.startTime, payload.endTime)
  return bookings.some(booking => {
    if (!payload.roomIds.includes(booking.resourceId)) return false
    return (
      start < formatOsloDateTime(booking.end) &&
      end > formatOsloDateTime(booking.start)
    )
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
  payload: RoomBookingPayload & { honeypot?: string },
): Promise<Result<number>> {
  // Silently accept honeypot hits — nothing is forwarded to Crescat.
  if (payload.honeypot?.trim()) return ok(-1)

  if (await isSubmissionRateLimited("submitRoomBooking")) {
    return err(RATE_LIMIT_ERROR)
  }

  const parsed = payloadSchema.safeParse(payload)
  if (!parsed.success) {
    return err(INVALID_PAYLOAD_ERROR)
  }

  if (!(await isAllowedByOpeningHours(parsed.data))) {
    return err("Valgt tidspunkt er ikke tilgjengelig for dette rommet.")
  }

  if (await hasVenueCalendarConflict(parsed.data)) {
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
    getPostHogClient().capture({
      distinctId: "anonymous",
      event: "room_booking_submitted",
      properties: {
        booker_type: parsed.data.bookerType,
        room_id: parsed.data.roomIds[0],
        start_date: parsed.data.startDate,
        start_time: parsed.data.startTime,
        end_time: parsed.data.endTime,
        free_or_paid: parsed.data.freeOrPaid,
        open_or_closed: parsed.data.openOrClosed,
        crescat_event_id: result.value,
      },
    })
    return result
  }

  captureSubmitFailure("room_booking", result.error, {
    source: "submit-room-booking",
    failure_branch: "crescat_request_failed",
    booker_type: parsed.data.bookerType,
    room_id: parsed.data.roomIds[0],
    start_date: parsed.data.startDate,
  })
  return err(GENERIC_SUBMIT_ERROR)
}
