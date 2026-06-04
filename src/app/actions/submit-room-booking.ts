"use server"

import { z } from "zod"

import { postEventRequest } from "@/lib/integrations/crescat/client"
import { buildRoomBooking, slugForBookerType } from "@/lib/integrations/crescat/room-booking"
import { err, type Result } from "@/lib/result"

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

export async function submitRoomBooking(payload: RoomBookingPayload): Promise<Result<number>> {
    const parsed = payloadSchema.safeParse(payload)
    if (!parsed.success) {
        return err("Skjemaet er ufullstendig eller inneholder ugyldige verdier.")
    }

    const body = buildRoomBooking(parsed.data.bookerType, parsed.data)

    return postEventRequest(slugForBookerType(parsed.data.bookerType), body)
}
