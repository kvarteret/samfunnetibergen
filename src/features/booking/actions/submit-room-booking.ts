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
  fetchVenueCalendar,
  VENUE_CALENDAR_SLUG,
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
import {
  hasOpeningHoursRows,
  isSlotAllowedForCombinedHours,
} from "@/lib/opening-hours"
import { err, type Result } from "@/lib/result"
import { fetchBookableRooms, fetchHouseHours } from "@/lib/sanity/fetch"

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

const payloadSchema = z.object({
  bookerType: z.enum(["intern", "ekstern", "studentorg"]),
  eventName: z.string().trim().min(1),
  roomId: z.number().int().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(timeRegex),
  endTime: z.string().regex(timeRegex),
  doorsTime: z.string().regex(timeRegex).optional(),
  description: z.string().trim().default(""),
  audienceCount: z.number().int().min(0),
  openOrClosed: z.enum(["Åpent", "Lukket"]),
  furniture: z.string().trim().min(1),
  techEquipment: z.string().trim().min(1),
  cateringWishes: z.string().trim().default(""),
  freeOrPaid: z.enum(["Gratis", "Betalt"]),
  ticketTypes: z.string().trim().default(""),
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
  const bookings = await fetchVenueCalendar(
    VENUE_CALENDAR_SLUG,
    payload.startDate,
    addDaysDateOnly(payload.startDate, 1),
  )
  const start = toDateTime(payload.startDate, payload.startTime)
  const end = resolveEndDateTime(
    payload.startDate,
    payload.startTime,
    payload.endTime,
  )
  return bookings.some(booking => {
    if (booking.resourceId !== payload.roomId) return false
    return (
      start < formatOsloDateTime(booking.end) &&
      end > formatOsloDateTime(booking.start)
    )
  })
}

function durationHoursBetween(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(":").map(Number)
  const [endHour, endMinute] = endTime.split(":").map(Number)
  const startMin = startHour * 60 + startMinute
  const endMin = endHour * 60 + endMinute
  const diff = endMin - startMin
  return (diff <= 0 ? diff + 24 * 60 : diff) / 60
}

async function isAllowedByOpeningHours(
  payload: z.output<typeof payloadSchema>,
): Promise<boolean> {
  const [houseHours, rooms] = await Promise.all([
    fetchHouseHours(),
    fetchBookableRooms(),
  ])
  const room = rooms.find(
    candidate => candidate.crescatRoomId === payload.roomId,
  )
  if (!room) return false

  const baseHours = houseHours?.operationsManagerHours ?? null
  const roomHours = room.openingHours ?? null
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
  )
}

export async function submitRoomBooking(
  payload: RoomBookingPayload,
): Promise<Result<number>> {
  const parsed = payloadSchema.safeParse(payload)
  if (!parsed.success) {
    return err("Skjemaet er ufullstendig eller inneholder ugyldige verdier.")
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

  return postEventRequest(slugForBookerType(parsed.data.bookerType), body)
}
