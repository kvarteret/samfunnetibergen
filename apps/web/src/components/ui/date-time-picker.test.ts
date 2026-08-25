import { describe, expect, test } from "vitest"
import type { OpeningHours } from "@/lib/opening-hours"
import {
  computeMultiDayConstraints,
  multiDayMarks,
  timeOptionsForDay,
  unconstrainedMarks,
} from "./date-time-picker"

const MINUTES_IN_DAY = 24 * 60

// Open every weekday 12:00–22:00.
const DAYTIME_HOURS: OpeningHours = {
  rows: [
    {
      weekdays: [1, 2, 3, 4, 5, 6, 7],
      status: "open",
      duration: { start: "12:00", end: "22:00" },
    },
  ],
}

// Open every weekday 18:00–03:00 (closes after midnight).
const NIGHT_HOURS: OpeningHours = {
  rows: [
    {
      weekdays: [1, 2, 3, 4, 5, 6, 7],
      status: "open",
      duration: { start: "18:00", end: "03:00" },
    },
  ],
}

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

describe("timeOptionsForDay", () => {
  test("keeps doors-open options for a single-day booking crossing midnight", () => {
    const options = timeOptionsForDay(
      [20 * 60 + 45, 21 * 60, 23 * 60 + 45, 24 * 60, 24 * 60 + 45],
      0,
      1,
      20 * 60 + 45,
      45,
    )

    expect(options.map(option => option.value)).toEqual([
      "20:45",
      "21:00",
      "23:45",
      "00:00",
      "00:45",
    ])
  })
})

describe("computeMultiDayConstraints", () => {
  test("returns empty constraints for single-day bookings", () => {
    const result = computeMultiDayConstraints(
      "2026-06-23",
      1,
      DAYTIME_HOURS,
      null,
      [],
    )

    expect(result).toEqual({ stapledSegments: [] })
  })

  test("clamps first/last day thumbs to opening hours and staples the gap", () => {
    // 3-day booking, each day open 12:00–22:00. Hourly grid → index = d*24 + h.
    const result = computeMultiDayConstraints(
      "2026-06-23",
      3,
      DAYTIME_HOURS,
      null,
      [],
    )

    // Day 0: get-in clamped to 12:00 (index 12), get-out to 22:00 (index 22).
    expect(result.firstDayStartIdx).toBe(12)
    expect(result.firstDayEndIdx).toBe(22)
    // Day 2 (offset 48): get-in 60, get-out 70.
    expect(result.lastDayStartIdx).toBe(60)
    expect(result.lastDayEndIdx).toBe(70)
    // Stapled night gap between first get-out and last get-in.
    expect(result.stapledSegments).toEqual([{ startIdx: 23, endIdx: 59 }])
  })

  test("skips closed days so first/last entries are the open days", () => {
    // Day 1 (the middle day) is a house-closed date; constraints should still
    // anchor to days 0 and 2 and not crash on the empty middle day.
    const result = computeMultiDayConstraints(
      "2026-06-23",
      3,
      DAYTIME_HOURS,
      null,
      [{ date: "2026-06-24" }],
    )

    expect(result.firstDayStartIdx).toBe(12)
    expect(result.lastDayEndIdx).toBe(70)
  })

  test("extends the final day's get-out past midnight, get-in stays clamped", () => {
    // 2-day booking, each day open 18:00–03:00. Hourly grid → index = d*24 + h.
    const result = computeMultiDayConstraints(
      "2026-06-23",
      2,
      NIGHT_HOURS,
      null,
      [],
    )

    // Day 0 get-in: 18:00 (index 18). Get-out (first-day end) clamped to 23:00
    // so get-in never crosses into the next calendar day.
    expect(result.firstDayStartIdx).toBe(18)
    expect(result.firstDayEndIdx).toBe(23)
    // Day 1 (offset 24) get-in 18:00 → 42. Get-out at 03:00 the morning after
    // is index 24 + 27 = 51 — past the day's own 23:00 (would be 47).
    expect(result.lastDayStartIdx).toBe(42)
    expect(result.lastDayEndIdx).toBe(51)
    expect(result.stapledSegments).toEqual([{ startIdx: 24, endIdx: 41 }])
  })
})

describe("multiDayMarks", () => {
  test("uniform full grid when no day closes past midnight", () => {
    const marks = multiDayMarks("2026-06-23", 2, DAYTIME_HOURS, null, [])

    expect(marks).toHaveLength(2 * 24)
    expect(marks.every((value, index) => value === index * 60)).toBe(true)
  })

  test("appends the final day's post-midnight slots so get-out can reach them", () => {
    // Last day closes 03:00 → append 00:00,01:00,02:00,03:00 of the morning
    // after (indices 48–51), preserving value === index * 60.
    const marks = multiDayMarks("2026-06-23", 2, NIGHT_HOURS, null, [])

    expect(marks).toHaveLength(2 * 24 + 4)
    expect(marks.every((value, index) => value === index * 60)).toBe(true)
    // Index 51 is the get-out target; its time-of-day is 03:00.
    expect(marks[51]).toBe(51 * 60)
    expect(marks[51] % MINUTES_IN_DAY).toBe(3 * 60)
  })
})
