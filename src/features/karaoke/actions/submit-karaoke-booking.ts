"use server"

import { z } from "zod"

import type { KaraokeBookingPayload } from "@/features/karaoke/types"
import { postEventRequest } from "@/lib/integrations/crescat/client"
import { addDaysDateOnly } from "@/lib/integrations/crescat/datetime"
import {
  buildKaraokeRequest,
  KARAOKE_SLUG,
} from "@/lib/integrations/crescat/karaoke"
import { isSlotAllowed } from "@/lib/opening-hours"
import {
  getHandledExceptionProperties,
  toPostHogException,
} from "@/lib/posthog/error-context"
import { getPostHogClient } from "@/lib/posthog-server"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { err, ok, type Result } from "@/lib/result"
import { fetchHouseHours } from "@/lib/sanity/fetch"
import { slotOverlapsKaraokeBookings } from "../domain/availability"
import { calcKaraokePrice, KARAOKE_PRICING } from "../domain/formState"
import { timeToMinutes } from "../domain/time"
import type { PriceType } from "../types"
import { fetchKaraokeAvailability } from "./karaoke-availability"

const GENERIC_ERROR = "Noe gikk galt. Prøv igjen senere."
const RATE_LIMIT_ERROR = "For mange forsøk. Vent litt og prøv igjen."
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const SUBMIT_LIMIT = 5

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

const karaokePayloadSchema = z.object({
  eventName: z.string().trim().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(timeRegex),
  duration: z.number().int().min(1).max(4),
  endTime: z.string().regex(timeRegex),
  description: z.string().trim().default(""),
  contactName: z.string().trim().min(1),
  contactEmail: z.string().trim().email(),
  contactPhone: z.string().trim().default(""),
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
  payload: KaraokeBookingPayload & { honeypot?: string },
): Promise<Result<number>> {
  // Silently accept honeypot hits — nothing is forwarded to Crescat.
  if (payload.honeypot?.trim()) return ok(-1)

  const ip = await getClientIp()
  if (
    !checkRateLimit({
      name: "submitKaraokeBooking",
      ip,
      limit: SUBMIT_LIMIT,
      windowMs: RATE_LIMIT_WINDOW_MS,
    })
  ) {
    return err(RATE_LIMIT_ERROR)
  }

  const parsed = karaokePayloadSchema.safeParse(payload)
  if (!parsed.success) {
    return err("Skjemaet er ufullstendig eller inneholder ugyldige verdier.")
  }

  const houseHours = await fetchHouseHours()
  const slotAllowed = isSlotAllowed(
    parsed.data.startDate,
    parsed.data.startTime,
    parsed.data.duration,
    houseHours?.operationsManagerHours,
    houseHours?.houseClosedDates,
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

  const posthog = getPostHogClient()
  if (result.ok) {
    posthog.capture({
      distinctId: "anonymous",
      event: "karaoke_booking_submitted",
      properties: {
        price_type: parsed.data.priceType,
        number_of_people: parsed.data.numberOfPeople,
        duration_hours: parsed.data.duration,
        total_price: totalPrice,
        start_date: parsed.data.startDate,
        crescat_event_id: result.value,
      },
    })
    return result
  }

  // Keep internal error detail in PostHog; return generic message to client.
  posthog.capture({
    distinctId: "anonymous",
    event: "karaoke_booking_submit_failed",
    properties: {
      price_type: parsed.data.priceType,
      start_date: parsed.data.startDate,
      error: result.error,
    },
  })
  posthog.captureException(
    toPostHogException(result.error),
    "anonymous",
    getHandledExceptionProperties("karaoke_booking", {
      source: "submit-karaoke-booking",
      failure_branch: "crescat_request_failed",
      price_type: parsed.data.priceType,
      start_date: parsed.data.startDate,
    }),
  )
  return err(GENERIC_ERROR)
}
