import { z } from "zod"

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isValidDateOnly(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

export const karaokeFormSchema = z
  .object({
    eventName: z.string().trim().min(1, "Skriv inn navn på arrangementet."),
    startDate: z.string().refine(isValidDateOnly, "Velg en gyldig dato."),
    startSlotMin: z
      .number()
      .int()
      .min(0)
      .max(2880)
      .nullable()
      .refine(value => value !== null, "Velg dato og starttidspunkt."),
    duration: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    description: z.string(),
    contactName: z.string().trim().min(1, "Skriv inn navn på kontaktperson."),
    contactEmail: z.string().trim().email("Skriv inn en gyldig e-postadresse."),
    contactPhone: z.string(),
    priceType: z.enum(["ordinær", "student", "frivillig"]),
    numberOfPeople: z.string().trim().regex(/^\d+$/, "Velg antall personer."),
    acceptTerms: z.boolean().refine(value => value, {
      message: "Bekreft at du godtar bruksvilkårene.",
    }),
    studentProofAccepted: z.boolean(),
  })
  .superRefine((value, context) => {
    const people = Number(value.numberOfPeople)
    if (!Number.isSafeInteger(people) || people < 1 || people > 25) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["numberOfPeople"],
        message: "Velg et antall personer mellom 1 og 25.",
      })
    }

    if (value.priceType === "student" && !value.studentProofAccepted) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["studentProofAccepted"],
        message: "Bekreft at du tar med studentbevis.",
      })
    }
  })

export type KaraokeFormState = z.input<typeof karaokeFormSchema>
