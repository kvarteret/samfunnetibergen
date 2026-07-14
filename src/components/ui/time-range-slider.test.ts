import { describe, expect, test } from "vitest"

import {
  computeTickMarks,
  formatDurationLabel,
  occupiedStripeSegments,
  timeIndexWithin,
} from "./time-range-slider"

describe("timeIndexWithin", () => {
  const marks = [600, 660, 720, 1440 + 600] // 10:00, 11:00, 12:00, day 2 10:00

  test("finds a mark by local time-of-day within the search window", () => {
    expect(timeIndexWithin(marks, "11:00", 0, marks.length)).toBe(1)
  })

  test("matches past-midnight marks by their wrapped time", () => {
    expect(timeIndexWithin(marks, "10:00", 3, marks.length)).toBe(3)
  })

  test("returns -1 outside the window or when absent", () => {
    expect(timeIndexWithin(marks, "10:00", 1, 3)).toBe(-1)
    expect(timeIndexWithin(marks, "09:15", 0, marks.length)).toBe(-1)
  })
})

describe("formatDurationLabel", () => {
  test("formats single-day hour/minute combinations", () => {
    expect(formatDurationLabel(45, false)).toBe("45m")
    expect(formatDurationLabel(120, false)).toBe("2t")
    expect(formatDurationLabel(210, false)).toBe("3t 30m")
  })

  test("formats multi-day day/hour combinations", () => {
    expect(formatDurationLabel(4 * 60, true)).toBe("4t")
    expect(formatDurationLabel(48 * 60, true)).toBe("2d")
    expect(formatDurationLabel(28 * 60, true)).toBe("1d 4t")
  })

  test("returns empty for non-positive durations", () => {
    expect(formatDurationLabel(0, false)).toBe("")
    expect(formatDurationLabel(-60, true)).toBe("")
  })
})

describe("computeTickMarks", () => {
  test("single-day: one tick per even 2-hour mark", () => {
    const marks = [600, 660, 720, 780, 840] // 10:00–14:00 hourly
    const ticks = computeTickMarks(marks, 1, 0, 600, 240)

    expect(ticks.map(t => t.label)).toEqual(["10:00", "12:00", "14:00"])
    expect(ticks[1].pct).toBe(50)
  })

  test("multi-day: one tick per spanned day", () => {
    const marks = [0, 60, 1440, 1500] // day 1 and day 2 starts
    const ticks = computeTickMarks(marks, 2, 0, 0, 1500)

    expect(ticks.map(t => t.label)).toEqual(["Dag 1", "Dag 2"])
  })
})

describe("occupiedStripeSegments", () => {
  test("clamps ranges to the visible track and converts to percentages", () => {
    const segments = occupiedStripeSegments(
      [
        { startMin: 0, endMin: 700 }, // clipped at track start
        { startMin: 800, endMin: 900 },
        { startMin: 2000, endMin: 2100 }, // outside the track entirely
      ],
      600,
      1000,
      400,
    )

    expect(segments).toEqual([
      { left: 0, width: 25 },
      { left: 50, width: 25 },
    ])
  })
})
