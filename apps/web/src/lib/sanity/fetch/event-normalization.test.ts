import { describe, expect, test } from "vitest"
import { cleanEventDate, cleanEventLogicFields } from "./event-normalization"
import { encodeStegaForTest as encoded } from "./test-stega"

describe("event Stega normalization", () => {
  test("cleans domain fields without stripping display fields", () => {
    const title = encoded("Festivaløkt")
    const event = cleanEventLogicFields({
      title,
      eventKind: encoded("festivalSession"),
      eventStatus: encoded("confirmed"),
      approvalStatus: encoded("approved"),
      promotedPlacement: encoded("frontPage"),
      orderRank: encoded("a0"),
      rrule: encoded("FREQ=WEEKLY"),
    })

    expect(event).toMatchObject({
      eventKind: "festivalSession",
      eventStatus: "confirmed",
      approvalStatus: "approved",
      promotedPlacement: "frontPage",
      orderRank: "a0",
      rrule: "FREQ=WEEKLY",
    })
    expect(event.title).toBe(title)
    expect(event.title).not.toBe("Festivaløkt")
  })

  test("cleans date and time fields used for parsing and sorting", () => {
    expect(
      cleanEventDate({
        startDate: encoded("2026-09-01"),
        startTime: encoded("18:00"),
        endTime: encoded("20:00"),
      }),
    ).toEqual({
      startDate: "2026-09-01",
      startTime: "18:00",
      endTime: "20:00",
    })
  })
})
