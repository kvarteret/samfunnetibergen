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
    message: "Velg en gyldig sluttdato.",
  })

const timeOrEmpty = z
  .string()
  .refine(value => value === "" || TIME_PATTERN.test(value), {
    message: "Velg et gyldig klokkeslett.",
  })

const ticketTypeSchema = z.object({
  name: z.string(),
  price: z.string(),
})

export const bookingFormSchema = z
  .object({
    bookerType: z.enum(["ekstern", "studentorg", "intern"]),
    studentOrgName: z.string(),
    selectedRoomIds: z
      .array(z.number().int().positive())
      .min(1, "Velg minst ett rom."),
    eventName: z.string().trim().min(1, "Skriv inn navn på arrangementet."),
    startDate: z.string().refine(isValidDateOnly, "Velg en gyldig dato."),
    endDate: optionalDate,
    startTime: z.string().regex(TIME_PATTERN, "Velg et gyldig starttidspunkt."),
    endTime: z.string().regex(TIME_PATTERN, "Velg et gyldig sluttidspunkt."),
    doorsTimes: z
      .array(timeOrEmpty)
      .min(1, "Velg når dørene åpner for publikum."),
    estimatedEndTimes: z.array(timeOrEmpty),
    audienceCount: z
      .string()
      .trim()
      .regex(/^\d+$/, "Skriv inn et helt antall publikum."),
    openOrClosed: z.enum(["Åpent", "Lukket"]),
    description: z.string(),
    furniture: z.string().trim().min(1, "Skriv inn ønsket møblement."),
    micEnabled: z.boolean(),
    micQuantity: z.number().int().min(1, "Velg minst én mikrofon."),
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
    freeOrPaid: z.enum(["Gratis", "Betalt"]),
    ticketTypes: z.array(ticketTypeSchema),
    ticketSalesMethod: z.enum(["house", "ownTerminal"]),
    invoiceAddress: z.string(),
    orgNumber: z.string(),
    flexibleDates: z.boolean(),
    acceptTerms: z.boolean().refine(value => value, {
      message: "Bekreft at du har lest og godtar bookingvilkårene.",
    }),
    contactName: z.string().trim().min(1, "Skriv inn navn på kontaktperson."),
    contactEmail: z.string().trim().email("Skriv inn en gyldig e-postadresse."),
    contactPhone: z
      .string()
      .refine(isOptionalE164PhoneNumber, "Skriv inn et gyldig telefonnummer."),
    promote: z.enum(["", "ja", "nei"]),
  })
  .superRefine((value, context) => {
    if (value.endDate && value.endDate < value.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Sluttdatoen kan ikke være før startdatoen.",
      })
    }

    if (!value.doorsTimes[0] || !TIME_PATTERN.test(value.doorsTimes[0])) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["doorsTimes"],
        message: "Velg når dørene åpner for publikum.",
      })
    }

    if (value.bookerType === "studentorg" && !value.studentOrgName.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["studentOrgName"],
        message: "Skriv inn navn på studentorganisasjonen.",
      })
    }

    if (value.bookerType !== "intern" && !value.invoiceAddress.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["invoiceAddress"],
        message: "Skriv inn fakturaadresse.",
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
          message:
            "Legg til minst én billettype med pris for betalte arrangement.",
        })
      }
    }

    if (value.orgNumber.trim() && !/^\d+$/.test(value.orgNumber.trim())) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["orgNumber"],
        message: "Organisasjonsnummeret kan bare inneholde sifre.",
      })
    }
  })

export type BookingFormState = z.input<typeof bookingFormSchema>
export type BookingBookerType = BookerType
export type TicketType = z.input<typeof ticketTypeSchema>
