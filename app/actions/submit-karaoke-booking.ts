"use server"

import { postEventRequest } from "@/lib/crescat/client"
import { buildKaraokeRequest, KARAOKE_SLUG } from "@/lib/crescat/karaoke"
import type { Result } from "@/lib/result"

export type PriceType = "ordinær" | "student" | "frivillig"

export type KaraokeBookingPayload = {
    eventName: string
    startDate: string
    startTime: string
    duration: number
    endTime: string
    description: string
    contactName: string
    contactEmail: string
    contactPhone: string
    priceType: PriceType
    numberOfPeople: number
    totalPrice: number
}

export async function submitKaraokeBooking(
    payload: KaraokeBookingPayload,
): Promise<Result<number>> {
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
