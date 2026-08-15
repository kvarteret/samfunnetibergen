import { z } from "zod"
import { isE164PhoneNumber } from "@/lib/phone-number"

const GROUP_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const VOLUNTEER_FORM_LIMITS = {
  firstName: 100,
  lastName: 100,
  email: 254,
  phone: 16,
  studyInstitution: 160,
  backgroundDetails: 2_000,
  groupSlug: 100,
  friendEmails: 2,
  honeypot: 200,
} as const

export const volunteerHoneypotSchema = z
  .string()
  .max(VOLUNTEER_FORM_LIMITS.honeypot)

const optionalGroupSlug = z
  .string()
  .trim()
  .max(VOLUNTEER_FORM_LIMITS.groupSlug, "Gruppenavnet er for langt.")
  .refine(
    value => value === "" || GROUP_SLUG_PATTERN.test(value),
    "Velg en gyldig gruppe.",
  )

export const volunteerFormSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "Fornavn er påkrevd.")
      .max(VOLUNTEER_FORM_LIMITS.firstName, "Fornavnet er for langt."),
    lastName: z
      .string()
      .trim()
      .min(1, "Etternavn er påkrevd.")
      .max(VOLUNTEER_FORM_LIMITS.lastName, "Etternavnet er for langt."),
    email: z
      .string()
      .trim()
      .max(VOLUNTEER_FORM_LIMITS.email, "E-postadressen er for lang.")
      .email("Ugyldig e-postadresse."),
    phone: z
      .string()
      .trim()
      .max(VOLUNTEER_FORM_LIMITS.phone, "Telefonnummeret er for langt.")
      .refine(isE164PhoneNumber, "Skriv inn et gyldig telefonnummer."),
    studyInstitution: z
      .string()
      .trim()
      .min(1, "Studiested er påkrevd.")
      .max(
        VOLUNTEER_FORM_LIMITS.studyInstitution,
        "Studiestedet er for langt.",
      ),
    backgroundDetails: z
      .string()
      .trim()
      .max(
        VOLUNTEER_FORM_LIMITS.backgroundDetails,
        "Bakgrunnsteksten er for lang.",
      ),
    firstChoiceGroupSlug: z
      .string()
      .trim()
      .min(1, "Velg en gruppe du vil søke til.")
      .max(VOLUNTEER_FORM_LIMITS.groupSlug, "Gruppenavnet er for langt.")
      .regex(GROUP_SLUG_PATTERN, "Velg en gyldig gruppe."),
    secondChoiceGroupSlug: optionalGroupSlug,
    friendEmails: z
      .array(
        z
          .string()
          .trim()
          .max(VOLUNTEER_FORM_LIMITS.email, "E-postadressen er for lang.")
          .email("Ugyldig e-postadresse."),
      )
      .max(
        VOLUNTEER_FORM_LIMITS.friendEmails,
        "Du kan melde på maksimalt to venner.",
      ),
  })
  .superRefine((value, context) => {
    const normalizedEmail = value.email.trim().toLowerCase()
    const normalizedFriends = value.friendEmails.map(email =>
      email.trim().toLowerCase(),
    )

    if (
      value.secondChoiceGroupSlug &&
      value.secondChoiceGroupSlug === value.firstChoiceGroupSlug
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["secondChoiceGroupSlug"],
        message: "Andrevalget må være en annen gruppe.",
      })
    }

    normalizedFriends.forEach((friendEmail, index) => {
      if (friendEmail === normalizedEmail) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["friendEmails", index],
          message: "E-postadressene må være ulike.",
        })
      }
      if (
        normalizedFriends.findIndex(candidate => candidate === friendEmail) !==
        index
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["friendEmails", index],
          message: "E-postadressene må være ulike.",
        })
      }
    })
  })

export type VolunteerFormValues = z.input<typeof volunteerFormSchema>
