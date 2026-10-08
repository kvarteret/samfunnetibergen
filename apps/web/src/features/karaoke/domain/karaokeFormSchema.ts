import { z } from "zod"
import { isOptionalE164PhoneNumber } from "@/lib/phone-number"

const defaultValidationMessages = {
  eventName: "Skriv inn navn på arrangementet.",
  date: "Velg en gyldig dato.",
  start: "Velg dato og starttidspunkt.",
  contactName: "Skriv inn navn på kontaktperson.",
  email: "Skriv inn en gyldig e-postadresse.",
  phone: "Skriv inn et gyldig telefonnummer.",
  people: "Velg antall personer.",
  terms: "Bekreft at du godtar bruksvilkårene.",
  peopleRange: "Velg et antall personer mellom 1 og 25.",
  studentProof: "Bekreft at du tar med studentbevis.",
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isValidDateOnly(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

export function createKaraokeFormSchema(
  t: (key: keyof typeof defaultValidationMessages) => string = key =>
    defaultValidationMessages[key],
) {
  return z
    .object({
      eventName: z.string().trim().min(1, t("eventName")),
      startDate: z.string().refine(isValidDateOnly, t("date")),
      startSlotMin: z
        .number()
        .int()
        .min(0)
        .max(2880)
        .nullable()
        .refine(value => value !== null, t("start")),
      duration: z.union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
      ]),
      description: z.string(),
      contactName: z.string().trim().min(1, t("contactName")),
      contactEmail: z.string().trim().email(t("email")),
      contactPhone: z.string().refine(isOptionalE164PhoneNumber, t("phone")),
      priceType: z.enum(["ordinær", "student", "frivillig"]),
      numberOfPeople: z.string().trim().regex(/^\d+$/, t("people")),
      acceptTerms: z.boolean().refine(value => value, {
        message: t("terms"),
      }),
      studentProofAccepted: z.boolean(),
    })
    .superRefine((value, context) => {
      const people = Number(value.numberOfPeople)
      if (!Number.isSafeInteger(people) || people < 1 || people > 25) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["numberOfPeople"],
          message: t("peopleRange"),
        })
      }

      if (value.priceType === "student" && !value.studentProofAccepted) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["studentProofAccepted"],
          message: t("studentProof"),
        })
      }
    })
}

export const karaokeFormSchema = createKaraokeFormSchema()

export type KaraokeFormState = z.input<typeof karaokeFormSchema>
