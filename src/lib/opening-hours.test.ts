import { describe, expect, test } from "vitest"
import {
  formatOpeningHoursTime,
  formatOpeningDate,
  formatVacationModeNotice,
  isVacationModeActive,
  minutesToTime,
  openingHoursDaySummaries,
  openingHoursStatusAt,
  type OpeningHours,
  openingRangesForDate,
  slotRangesForDate,
} from "./opening-hours"

function rows(...durations: [string, string][]): OpeningHours {
  return {
    rows: durations.map(([start, end]) => ({
      weekdays: [1, 2, 3, 4, 5, 6, 7],
      status: "open" as const,
      duration: { start, end },
    })),
  }
}

// Two opening-hours rows that both match every weekday and overlap in time.
// Real Sanity data can hold several rows for the same day, which previously
// produced duplicate, out-of-order slots in the karaoke picker.
const OVERLAPPING_ROWS: OpeningHours = {
  rows: [
    {
      weekdays: [1, 2, 3, 4, 5, 6, 7],
      status: "open",
      duration: { start: "12:00", end: "22:00" },
    },
    {
      weekdays: [1, 2, 3, 4, 5, 6, 7],
      status: "open",
      duration: { start: "10:00", end: "22:00" },
    },
  ],
}

describe("openingRangesForDate", () => {
  // The invariant every consumer relies on: ranges come back sorted, with
  // overlapping or touching rows merged into one, never duplicated.
  test("merges overlapping rows into one range", () => {
    const ranges = openingRangesForDate(
      "2026-08-13",
      rows(["12:00", "22:00"], ["10:00", "22:00"]),
      [],
    )

    expect(ranges).toEqual([{ startMin: 600, endMin: 1320 }])
  })

  test("merges touching rows (end of one == start of next)", () => {
    const ranges = openingRangesForDate(
      "2026-08-13",
      rows(["10:00", "14:00"], ["14:00", "18:00"]),
      [],
    )

    expect(ranges).toEqual([{ startMin: 600, endMin: 1080 }])
  })

  test("keeps genuinely disjoint rows separate and sorted", () => {
    const ranges = openingRangesForDate(
      "2026-08-13",
      rows(["14:00", "16:00"], ["10:00", "12:00"]),
      [],
    )

    expect(ranges).toEqual([
      { startMin: 600, endMin: 720 },
      { startMin: 840, endMin: 960 },
    ])
  })

  test("returns no ranges while vacation mode is active", () => {
    const ranges = openingRangesForDate(
      "2026-07-31",
      rows(["10:00", "18:00"]),
      [],
      { enabled: true, from: "2026-07-01", to: "2026-08-01" },
    )

    expect(ranges).toEqual([])
  })

  test("uses normal hours on the vacation reopening date", () => {
    const ranges = openingRangesForDate(
      "2026-08-01",
      rows(["10:00", "18:00"]),
      [],
      { enabled: true, from: "2026-07-01", to: "2026-08-01" },
    )

    expect(ranges).toEqual([{ startMin: 600, endMin: 1080 }])
  })
})

describe("slotRangesForDate", () => {
  test("dedupes and sorts slots across overlapping opening-hours rows", () => {
    const slots = slotRangesForDate("2026-08-13", 2, OVERLAPPING_ROWS, [])

    // Union of both rows, each slot once, ascending.
    expect(slots.map(minutesToTime)).toEqual([
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
    ])
    expect(new Set(slots).size).toBe(slots.length)
    expect(slots).toEqual([...slots].sort((a, b) => a - b))
  })

  test("returns no slots when the duration cannot fit the opening window", () => {
    const slots = slotRangesForDate("2026-08-13", 24, OVERLAPPING_ROWS, [])

    expect(slots).toEqual([])
  })
})

describe("openingHoursStatusAt", () => {
  test("returns closing time while open", () => {
    const status = openingHoursStatusAt(
      new Date("2026-08-13T12:30:00+02:00"),
      rows(["10:00", "21:00"]),
      [],
    )

    expect(status.isOpen).toBe(true)
    expect(formatOpeningHoursTime(status.currentRange!.endMin)).toBe("21")
  })

  test("returns next opening range while closed", () => {
    const status = openingHoursStatusAt(
      new Date("2026-08-13T22:30:00+02:00"),
      rows(["10:00", "21:00"]),
      [],
    )

    expect(status.isOpen).toBe(false)
    expect(status.nextDate).toBe("2026-08-14")
    expect(formatOpeningHoursTime(status.nextRange!.startMin)).toBe("10")
  })

  test("uses the first normal opening after a long vacation period", () => {
    const status = openingHoursStatusAt(
      new Date("2026-07-08T12:00:00+02:00"),
      rows(["10:00", "21:00"]),
      [],
      {
        enabled: true,
        from: "2026-07-01",
        to: "2026-08-01",
      },
    )

    expect(status.isOpen).toBe(false)
    expect(status.nextDate).toBe("2026-08-01")
    expect(formatOpeningHoursTime(status.nextRange!.startMin)).toBe("10")
  })
})

describe("formatOpeningDate", () => {
  test("formats a compact Norwegian opening date", () => {
    expect(formatOpeningDate("2026-08-10")).toBe("10. august")
  })
})

describe("openingHoursDaySummaries", () => {
  test("starts with the current day and includes the requested count", () => {
    const summaries = openingHoursDaySummaries(
      new Date("2026-08-12T12:00:00+02:00"),
      7,
      rows(["10:00", "21:00"]),
      [],
    )

    expect(summaries).toHaveLength(7)
    expect(summaries[0]).toMatchObject({
      date: "2026-08-12",
      dayLabel: "onsdag",
    })
    expect(summaries[6]).toMatchObject({
      date: "2026-08-18",
      dayLabel: "tirsdag",
    })
  })
})

describe("vacation mode", () => {
  test("is inactive before the vacation period starts", () => {
    const vacationMode = {
      enabled: true,
      from: "2026-07-01",
      to: "2026-08-01",
    }

    expect(isVacationModeActive("2026-06-30", vacationMode)).toBe(false)
  })

  test("is active before the reopening date and inactive on that date", () => {
    const vacationMode = {
      enabled: true,
      from: "2026-07-01",
      to: "2026-08-01",
    }

    expect(isVacationModeActive("2026-07-31", vacationMode)).toBe(true)
    expect(isVacationModeActive("2026-08-01", vacationMode)).toBe(false)
  })

  test("formats the reopening notice while active", () => {
    const notice = formatVacationModeNotice("2026-07-31", {
      enabled: true,
      from: "2026-07-01",
      to: "2026-08-01",
    })

    expect(notice).toBe("Vi åpner igjen 1. august 2026")
  })
})
