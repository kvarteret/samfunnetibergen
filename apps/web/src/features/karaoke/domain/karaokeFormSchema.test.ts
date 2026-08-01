import { describe, expect, test } from "vitest"
import { initialKaraokeState } from "./formState"
import { karaokeFormSchema } from "./karaokeFormSchema"

const validKaraoke = {
  ...initialKaraokeState,
  eventName: "Karaokekveld",
  startDate: "2026-08-20",
  startSlotMin: 19 * 60,
  contactName: "Kari Nordmann",
  contactEmail: "kari@example.com",
  acceptTerms: true,
  studentProofAccepted: true,
}

describe("karaokeFormSchema", () => {
  test("validates the raw browser state", () => {
    expect(karaokeFormSchema.safeParse(validKaraoke).success).toBe(true)
  })

  test("requires student proof for the student price type", () => {
    const result = karaokeFormSchema.safeParse({
      ...validKaraoke,
      studentProofAccepted: false,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some(
          issue => issue.path[0] === "studentProofAccepted",
        ),
      ).toBe(true)
    }
  })
})
