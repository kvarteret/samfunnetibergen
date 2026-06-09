"use server"

import type { KaraokeBookingPayload } from "@/features/karaoke/types"
import { postEventRequest } from "@/lib/integrations/crescat/client"
import {
  buildKaraokeRequest,
  KARAOKE_SLUG,
} from "@/lib/integrations/crescat/karaoke"
import { isSlotAllowed } from "@/lib/opening-hours"
import type { Result } from "@/lib/result"
import { fetchHouseHours } from "@/lib/sanity/fetch"

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
    return {
      ok: false,
      error: "Valgt tidspunkt er ikke tilgjengelig for booking.",
    }
  }

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

  return postEventRequest(KARAOKE_SLUG, body)
}
