import { describe, expect, test } from "vitest"
import { unconstrainedMarks } from "./date-time-picker"

const MINUTES_IN_DAY = 24 * 60

describe("unconstrainedMarks", () => {
  test("keeps a full grid for every day on multi-day bookings", () => {
    const dayCount = 3
    const marks = unconstrainedMarks(dayCount, 60)

    // Each day should contribute a full set of hourly marks, including the
    // last day's final slot (23:00) — losing it shifts indices computed by
    // callers that assume a full grid per day (e.g. lastDayEndIdx).
    expect(marks).toHaveLength(dayCount * 24)
    expect(marks.at(-1)).toBe((dayCount - 1) * MINUTES_IN_DAY + 23 * 60)
  })

  test("still drops the very last mark for single-day bookings", () => {
    const marks = unconstrainedMarks(1, 15)

    // 24h / 15min = 96 marks; the last one is removed so it can't be picked
    // as a start time with no remaining slot for an end time.
    expect(marks).toHaveLength(95)
    expect(marks.at(-1)).toBe(23 * 60 + 30)
  })
})
