"use server"

import type { KaraokeBookingPayload } from "@/features/karaoke/types"
import { postEventRequest } from "@/lib/integrations/crescat/client"
import {
  buildKaraokeRequest,
  KARAOKE_SLUG,
} from "@/lib/integrations/crescat/karaoke"
import { isSlotAllowed } from "@/lib/opening-hours"
import { err, ok, type Result } from "@/lib/result"
import { fetchHouseHours } from "@/lib/sanity/fetch"
import { KARAOKE_PRICING } from "../domain/formState"
import type { PriceType } from "../types"

export interface KaraokeBookingResult {
  statusCode: number
  totalPrice: number
  priceType: PriceType
  bookerLabel: string
}

function bookerLabel(priceType: PriceType): string {
  switch (priceType) {
    case "frivillig": return "Intern frivillig"
    case "ordinær":  return "Ekstern"
    case "student":  return "Ekstern (student)"
  }
}

function calcPrice(
  priceType: PriceType,
  people: number,
  durationHours: number,
): number {
  if (people <= 0 || priceType === "frivillig") return 0
  const price = KARAOKE_PRICING[priceType]
  return Math.max(price.perPerson * people, price.minPerHour) * durationHours
}

export async function submitKaraokeBooking(
  payload: KaraokeBookingPayload,
): Promise<Result<KaraokeBookingResult>> {
  const houseHours = await fetchHouseHours()
  const slotAllowed = isSlotAllowed(
    payload.startDate,
    payload.startTime,
    payload.duration,
    houseHours?.operationsManagerHours,
    houseHours?.houseClosedDates,
  )

  if (!slotAllowed) {
    return err("Valgt tidspunkt er ikke tilgjengelig for booking.")
  }

  const totalPrice = calcPrice(
    payload.priceType,
    payload.numberOfPeople,
    payload.duration,
  )

  const body = buildKaraokeRequest({
    eventName: payload.eventName,
    startDate: payload.startDate,
    startTime: payload.startTime,
    durationHours: payload.duration,
    description: payload.description,
    contactName: payload.contactName,
    contactEmail: payload.contactEmail,
    contactPhone: payload.contactPhone,
    numberOfPeople: payload.numberOfPeople,
    priceType: payload.priceType,
  })

  const result = await postEventRequest(KARAOKE_SLUG, body)

  if (!result.ok) return result

  return ok({
    statusCode: result.value,
    totalPrice,
    priceType: payload.priceType,
    bookerLabel: bookerLabel(payload.priceType),
  })
}
