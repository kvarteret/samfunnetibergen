import { describe, expect, test } from "vitest"
import {
  VOLUNTEER_FORM_LIMITS,
  volunteerFormSchema,
  volunteerHoneypotSchema,
} from "./volunteerFormSchema"

const validVolunteer = {
  firstName: "Kari",
  lastName: "Nordmann",
  email: "kari@example.com",
  phone: "+4740612345",
  studyInstitution: "UiB",
  backgroundDetails: "",
  firstChoiceGroupSlug: "kraftetaten",
  secondChoiceGroupSlug: "",
  friendEmails: ["venn@example.com"],
}

describe("volunteerFormSchema", () => {
  test("accepts the E.164 value emitted by the phone field", () => {
    expect(volunteerFormSchema.safeParse(validVolunteer).success).toBe(true)
  })

  test("rejects national and malformed values", () => {
    expect(
      volunteerFormSchema.safeParse({
        ...validVolunteer,
        phone: "406 12 345",
      }).success,
    ).toBe(false)
    expect(
      volunteerFormSchema.safeParse({
        ...validVolunteer,
        phone: "+47123",
      }).success,
    ).toBe(false)
  })

  test("rejects self-referrals and duplicate friend emails", () => {
    const result = volunteerFormSchema.safeParse({
      ...validVolunteer,
      friendEmails: [
        "kari@example.com",
        "venn@example.com",
        "ekstra@example.com",
      ],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some(issue => issue.path[0] === "friendEmails"),
      ).toBe(true)
    }
  })

  test.each([
    [
      "firstName",
      { firstName: "a".repeat(VOLUNTEER_FORM_LIMITS.firstName + 1) },
      "Fornavnet er for langt.",
    ],
    [
      "lastName",
      { lastName: "a".repeat(VOLUNTEER_FORM_LIMITS.lastName + 1) },
      "Etternavnet er for langt.",
    ],
    [
      "email",
      { email: `${"a".repeat(VOLUNTEER_FORM_LIMITS.email)}@example.com` },
      "E-postadressen er for lang.",
    ],
    [
      "phone",
      { phone: `+${"4".repeat(VOLUNTEER_FORM_LIMITS.phone)}` },
      "Telefonnummeret er for langt.",
    ],
    [
      "studyInstitution",
      {
        studyInstitution: "a".repeat(
          VOLUNTEER_FORM_LIMITS.studyInstitution + 1,
        ),
      },
      "Studiestedet er for langt.",
    ],
    [
      "backgroundDetails",
      {
        backgroundDetails: "a".repeat(
          VOLUNTEER_FORM_LIMITS.backgroundDetails + 1,
        ),
      },
      "Bakgrunnsteksten er for lang.",
    ],
    [
      "firstChoiceGroupSlug",
      {
        firstChoiceGroupSlug: "a".repeat(VOLUNTEER_FORM_LIMITS.groupSlug + 1),
      },
      "Gruppenavnet er for langt.",
    ],
    [
      "secondChoiceGroupSlug",
      {
        secondChoiceGroupSlug: "a".repeat(VOLUNTEER_FORM_LIMITS.groupSlug + 1),
      },
      "Gruppenavnet er for langt.",
    ],
    [
      "friendEmails",
      {
        friendEmails: [
          `${"a".repeat(VOLUNTEER_FORM_LIMITS.email)}@example.com`,
        ],
      },
      "E-postadressen er for lang.",
    ],
  ])("bounds %s", (field, override, message) => {
    const result = volunteerFormSchema.safeParse({
      ...validVolunteer,
      ...override,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some(
          issue => issue.path[0] === field && issue.message === message,
        ),
      ).toBe(true)
    }
  })

  test("allows at most two friend email entries", () => {
    const result = volunteerFormSchema.safeParse({
      ...validVolunteer,
      friendEmails: ["en@example.com", "to@example.com", "tre@example.com"],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["friendEmails"],
            message: "Du kan melde på maksimalt to venner.",
          }),
        ]),
      )
    }
  })

  test("bounds the honeypot field independently from required form fields", () => {
    expect(
      volunteerHoneypotSchema.safeParse(
        "a".repeat(VOLUNTEER_FORM_LIMITS.honeypot),
      ).success,
    ).toBe(true)
    expect(
      volunteerHoneypotSchema.safeParse(
        "a".repeat(VOLUNTEER_FORM_LIMITS.honeypot + 1),
      ).success,
    ).toBe(false)
  })
})
