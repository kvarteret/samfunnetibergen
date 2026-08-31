import { z } from "zod"

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export function isValidEventDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

const optionalTime = z
  .string()
  .refine(
    value => value === "" || TIME_PATTERN.test(value),
    "Skriv inn et gyldig klokkeslett.",
  )

const eventDateSchema = z.object({
  id: z.string().min(1),
  startDate: z
    .string()
    .refine(
      value => value === "" || isValidEventDateString(value),
      "Skriv inn en gyldig dato.",
    ),
  startTime: optionalTime,
  endTime: optionalTime,
})

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(1, "Skriv inn tittel."),
    titleEnglish: z.string().trim().min(1, "Skriv inn engelsk tittel."),
    description: z.string(),
    descriptionEnglish: z.string(),
    dates: z.array(eventDateSchema).min(1, "Legg til minst én dato."),
    isRecurring: z.boolean(),
    rrule: z.string(),
    room: z.string(),
    roomText: z.string(),
    roomTextEnglish: z.string(),
    organizerGroup: z.string(),
    organizerText: z.string(),
    organizerTextEnglish: z.string(),
    submittedByOrganization: z.string(),
    eventTypeId: z.string(),
    isInternalEvent: z.boolean(),
    isFree: z.boolean(),
    priceOrdinar: z.string(),
    priceStudent: z.string(),
    priceMedlem: z.string(),
    ticketUrl: z.string(),
    facebookUrl: z.string(),
    submittedBy: z.string().trim().min(1, "Skriv inn navn på kontaktperson."),
    submittedByEmail: z
      .string()
      .trim()
      .email("Skriv inn en gyldig e-postadresse."),
  })
  .superRefine((value, context) => {
    if (!value.dates.some(date => date.startDate)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dates", 0, "startDate"],
        message: "Fyll ut minst én gyldig dato.",
      })
    }

    if (value.isRecurring && !value.rrule.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rrule"],
        message:
          "Velg et gjentakelsesmønster for det gjentagende arrangementet.",
      })
    }

    const translationPairs = [
      ["description", "descriptionEnglish", "beskrivelse"],
      ["roomText", "roomTextEnglish", "stedsnavn"],
      ["organizerText", "organizerTextEnglish", "arrangørnavn"],
    ] as const

    for (const [sourceField, translationField, label] of translationPairs) {
      const source = value[sourceField].trim()
      const translation = value[translationField].trim()

      if (source && !translation) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [translationField],
          message: `Skriv inn engelsk ${label}.`,
        })
      }
      if (!source && translation) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [sourceField],
          message: `Fyll ut norsk ${label} eller fjern den engelske teksten.`,
        })
      }
    }
  })

export type EventFormDate = z.input<typeof eventDateSchema>
export type EventFormState = z.input<typeof eventFormSchema>
