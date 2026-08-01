import { z } from "zod"

const GROUP_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const optionalGroupSlug = z
  .string()
  .refine(
    value => value === "" || GROUP_SLUG_PATTERN.test(value.trim()),
    "Velg en gyldig gruppe.",
  )

export const volunteerFormSchema = z
  .object({
    firstName: z.string().trim().min(1, "Fornavn er påkrevd."),
    lastName: z.string().trim().min(1, "Etternavn er påkrevd."),
    email: z.string().trim().email("Ugyldig e-postadresse."),
    phone: z.string().trim().regex(/\d/, "Telefonnummer er påkrevd."),
    studyInstitution: z.string().trim().min(1, "Studiested er påkrevd."),
    backgroundDetails: z.string(),
    firstChoiceGroupSlug: z
      .string()
      .trim()
      .min(1, "Velg en gruppe du vil søke til.")
      .max(100)
      .regex(GROUP_SLUG_PATTERN, "Velg en gyldig gruppe."),
    secondChoiceGroupSlug: optionalGroupSlug,
    friendEmails: z
      .array(z.string().trim().email("Ugyldig e-postadresse."))
      .max(2, "Du kan melde på maksimalt to venner."),
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
