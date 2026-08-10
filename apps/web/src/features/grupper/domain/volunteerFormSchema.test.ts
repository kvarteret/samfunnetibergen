import { describe, expect, test } from "vitest"
import { volunteerFormSchema } from "./volunteerFormSchema"

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
})
