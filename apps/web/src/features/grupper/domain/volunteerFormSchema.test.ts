import { describe, expect, test } from "vitest"
import { volunteerFormSchema } from "./volunteerFormSchema"

const validVolunteer = {
  firstName: "Kari",
  lastName: "Nordmann",
  email: "kari@example.com",
  phone: "412 34 567",
  studyInstitution: "UiB",
  backgroundDetails: "",
  firstChoiceGroupSlug: "kraftetaten",
  secondChoiceGroupSlug: "",
  friendEmails: ["venn@example.com"],
}

describe("volunteerFormSchema", () => {
  test("accepts the raw browser state", () => {
    expect(volunteerFormSchema.safeParse(validVolunteer).success).toBe(true)
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
