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
      endTime: "23:00",
    },
  ],
  description: "Konsert i Teglverket.",
  descriptionEnglish: "Concert in Teglverket.",
  eventTypeId: "concert",
  hasImage: true,
  room: "tegl",
  organizerGroup: "asf",
  priceOrdinar: "200",
  ticketUrl: "https://ticketco.events/no/nb/e/test",
  submittedBy: "Kari Nordmann",
  submittedByEmail: "kari@example.com",
}

describe("eventFormSchema", () => {
  test("requires every field of a new arrangement", () => {
    const result = eventFormSchema.safeParse({
      ...initialState,
      title: "Tittel",
      titleEnglish: "Title",
      dates: validEvent.dates,
      submittedBy: "Kari Nordmann",
      submittedByEmail: "kari@example.com",
    })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.map(issue => issue.path[0])).toEqual([
        "eventTypeId",
        "description",
        "descriptionEnglish",
        "hasImage",
        "room",
        "organizerGroup",
        "priceOrdinar",
        "ticketUrl",
      ])
  })

  test("free events need neither price nor ticket link", () => {
    expect(
      eventFormSchema.safeParse({
        ...validEvent,
        isFree: true,
        priceOrdinar: "",
        ticketUrl: "",
      }).success,
    ).toBe(true)
  })

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
  ] as const)(
    "requires English text for populated %s",
    (sourceField, translationField) => {
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
    },
  )
})

test.each(["startTime", "endTime"] as const)(
  "requires %s on every dated row",
  field => {
    const result = eventFormSchema.safeParse({
      ...validEvent,
      dates: [
        validEvent.dates[0],
        { ...validEvent.dates[0], id: "second", [field]: "" },
      ],
    })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(
        result.error.issues.some(
          issue => issue.path.join(".") === `dates.1.${field}`,
        ),
      ).toBe(true)
  },
)

test("accepts doors closing after midnight", () => {
  expect(
    eventFormSchema.safeParse({
      ...validEvent,
      dates: [{ ...validEvent.dates[0], startTime: "23:00", endTime: "02:00" }],
    }).success,
  ).toBe(true)
})
