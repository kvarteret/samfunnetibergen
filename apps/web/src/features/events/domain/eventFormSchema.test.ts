import { describe, expect, test } from "vitest"
import { eventFormSchema } from "./eventFormSchema"
import { initialState } from "./formState"

const validEvent = {
  ...initialState,
  title: "Testarrangement",
  titleEnglish: "Test event",
  dates: [
    {
      ...initialState.dates[0],
      startDate: "2026-08-20",
      startTime: "19:00",
    },
  ],
  submittedBy: "Kari Nordmann",
  submittedByEmail: "kari@example.com",
}

describe("eventFormSchema", () => {
  test("accepts a complete non-recurring event", () => {
    expect(eventFormSchema.safeParse(validEvent).success).toBe(true)
  })

  test("requires a recurrence rule when recurring is selected", () => {
    const result = eventFormSchema.safeParse({
      ...validEvent,
      isRecurring: true,
      rrule: "",
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.path[0] === "rrule")).toBe(
        true,
      )
    }
  })

  test("requires an English title", () => {
    const result = eventFormSchema.safeParse({
      ...validEvent,
      titleEnglish: "",
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some(issue => issue.path[0] === "titleEnglish"),
      ).toBe(true)
    }
  })

  test.each([
    ["description", "descriptionEnglish"],
    ["roomText", "roomTextEnglish"],
    ["organizerText", "organizerTextEnglish"],
  ] as const)("requires English text for populated %s", (sourceField, translationField) => {
    const result = eventFormSchema.safeParse({
      ...validEvent,
      [sourceField]: "Norsk tekst.",
      [translationField]: "",
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some(issue => issue.path[0] === translationField),
      ).toBe(true)
    }
  })
})
