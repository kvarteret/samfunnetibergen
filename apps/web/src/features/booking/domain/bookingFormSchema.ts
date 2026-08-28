import { z } from "zod"
import type { BookerType } from "@/lib/integrations/crescat/room-booking"
import { isOptionalE164PhoneNumber } from "@/lib/phone-number"

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

const isValidDateOnly = (value: string): boolean => {
  if (!DATE_PATTERN.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

const optionalDate = z
  .string()
  .refine(value => value === "" || isValidDateOnly(value), {
    message: "validation.invalidEndDate",
  })

const timeOrEmpty = z
  .string()
  .refine(value => value === "" || TIME_PATTERN.test(value), {
    message: "validation.invalidTime",
  })

const ticketTypeSchema = z.object({
  name: z.string(),
  price: z.string(),
})

export const bookingFormSchema = z
  .object({
    bookerType: z.enum(
      ["ekstern", "studentorg", "intern"],
      "validation.bookerType",
    ),
    studentOrgName: z.string(),
    selectedRoomIds: z
      .array(z.number().int().positive())
      .min(1, "validation.roomRequired"),
    eventName: z.string().trim().min(1, "validation.eventName"),
    startDate: z.string().refine(isValidDateOnly, "validation.date"),
    endDate: optionalDate,
    startTime: z.string().regex(TIME_PATTERN, "validation.startTime"),
    endTime: z.string().regex(TIME_PATTERN, "validation.endTime"),
    doorsTimes: z.array(timeOrEmpty).min(1, "validation.doors"),
    estimatedEndTimes: z.array(timeOrEmpty),
    audienceCount: z.string().trim().regex(/^\d+$/, "validation.audience"),
    openOrClosed: z.enum(["Åpent", "Lukket"], "validation.eventType"),
    description: z.string(),
    furniture: z.string().trim().min(1, "validation.furniture"),
    micEnabled: z.boolean(),
    micQuantity: z.number().int().min(1, "validation.microphone"),
    projector: z.boolean(),
    music: z.boolean(),
    soundTech: z.boolean(),
    lightTech: z.boolean(),
    riggingSetup: z.boolean(),
    riggingTeardown: z.boolean(),
    needsAmphi: z.boolean(),
    cateringCustom: z.boolean(),
    cateringText: z.string(),
    barSelf: z.boolean(),
    barKvarteret: z.boolean(),
    freeOrPaid: z.enum(["Gratis", "Betalt"], "validation.ticketType"),
    ticketTypes: z.array(ticketTypeSchema),
    ticketSalesMethod: z.enum(
      ["house", "ownTerminal"],
      "validation.ticketSalesMethod",
    ),
    invoiceAddress: z.string(),
    orgNumber: z.string(),
    flexibleDates: z.boolean(),
    acceptTerms: z.boolean().refine(value => value, {
      message: "validation.terms",
    }),
    contactName: z.string().trim().min(1, "validation.contactName"),
    contactEmail: z.string().trim().email("validation.email"),
    contactPhone: z
      .string()
      .refine(isOptionalE164PhoneNumber, "validation.phone"),
    promote: z.enum(["", "ja", "nei"], "validation.promotion"),
  })
  .superRefine((value, context) => {
    if (value.endDate && value.endDate < value.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "validation.endBeforeStart",
      })
    }

    if (!value.doorsTimes[0] || !TIME_PATTERN.test(value.doorsTimes[0])) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["doorsTimes"],
        message: "validation.doors",
      })
    }

    if (value.bookerType === "studentorg" && !value.studentOrgName.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["studentOrgName"],
        message: "validation.organizationName",
      })
    }

    if (value.bookerType !== "intern" && !value.invoiceAddress.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["invoiceAddress"],
        message: "validation.invoiceAddress",
      })
    }

    if (value.freeOrPaid === "Betalt") {
      const hasTicket = value.ticketTypes.some(
        ticket => ticket.name.trim() !== "" && ticket.price.trim() !== "",
      )
      if (!hasTicket) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ticketTypes"],
          message: "validation.ticket",
        })
      }
    }

    if (value.orgNumber.trim() && !/^\d+$/.test(value.orgNumber.trim())) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["orgNumber"],
        message: "validation.organizationNumber",
      })
    }
  })

export type BookingFormState = z.input<typeof bookingFormSchema>
export type BookingBookerType = BookerType
export type TicketType = z.input<typeof ticketTypeSchema>
