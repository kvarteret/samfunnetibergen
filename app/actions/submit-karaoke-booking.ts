"use server"

import { postEventRequest } from "@/lib/crescat/client"
import { buildKaraokeRequest, KARAOKE_SLUG } from "@/lib/crescat/karaoke"

export type PriceType = "ordinær" | "student"

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

type Result = { ok: true } | { ok: false; error: string }

export async function submitKaraokeBooking(payload: KaraokeBookingPayload): Promise<Result> {
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
