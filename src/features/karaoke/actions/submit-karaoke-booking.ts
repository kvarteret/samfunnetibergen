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

function priceTypeLabel(pt: PriceType): string {
  switch (pt) {
    case "frivillig": return "Intern frivillig"
    case "ordinær":  return "Ekstern"
    case "student":  return "Ekstern (student)"
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
  payload: KaraokeBookingPayload,
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
  payload: KaraokeBookingPayload,
): Promise<Result<number>> {
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

  const totalPrice = payload.totalPrice

  const body = buildKaraokeRequest({
    eventName: payload.eventName,
    startDate: payload.startDate,
    startTime: payload.startTime,
    durationHours: payload.duration,
    description: enrichDescription(payload, totalPrice),
    contactName: payload.contactName,
    contactEmail: payload.contactEmail,
    contactPhone: payload.contactPhone,
    numberOfPeople: payload.numberOfPeople,
    priceType: payload.priceType,
  })

  return postEventRequest(KARAOKE_SLUG, body)
}
