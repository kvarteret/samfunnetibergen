import { describe, expect, test } from "vitest"
import {
  formatOpeningDate,
  formatOpeningHoursTime,
  formatVacationModeNotice,
  isBookingWindowAllowed,
  isVacationModeActive,
  minutesToTime,
  type OpeningHours,
  openingHoursDaySummaries,
  openingHoursStatusAt,
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

  // The bookable window opens 16:30 on Sundays, so hourly steps anchored to the
  // start used to stop at 20:30 and leave 21:00-22:00 unbookable.
  test("offers a slot flush against closing when the window opens on the half hour", () => {
    const slots = slotRangesForDate(
      "2026-08-13",
      1,
      rows(["16:30", "22:00"]),
      [],
    )

    expect(slots.map(minutesToTime)).toEqual([
      "16:30",
      "17:30",
      "18:30",
      "19:30",
      "20:30",
      "21:00",
    ])
  })

  test("keeps a single slot when only the closing-time slot fits", () => {
    const slots = slotRangesForDate(
      "2026-08-13",
      4,
      rows(["16:30", "20:30"]),
      [],
    )

    expect(slots.map(minutesToTime)).toEqual(["16:30"])
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

describe("isBookingWindowAllowed", () => {
  // Mirrors the house's bookable hours: Mon–Thu 12–01, Fri 12–03, Sat 14–03,
  // Sun 16:30–22.
  const bookable = {
    rows: [
      {
        weekdays: [1, 2, 3, 4],
        status: "open",
        duration: { start: "12:00", end: "01:00" },
      },
      {
        weekdays: [5],
        status: "open",
        duration: { start: "12:00", end: "03:00" },
      },
      {
        weekdays: [6],
        status: "open",
        duration: { start: "14:00", end: "03:00" },
      },
      {
        weekdays: [7],
        status: "open",
        duration: { start: "16:30", end: "22:00" },
      },
    ],
  }

  test("single day must fit one opening range", () => {
    // 2026-10-17 is a Saturday.
    expect(
      isBookingWindowAllowed("2026-10-17", "14:00", "", "02:00", bookable),
    ).toBe(true)
    expect(
      isBookingWindowAllowed("2026-10-17", "12:00", "", "13:00", bookable),
    ).toBe(false)
    expect(
      isBookingWindowAllowed(
        "2026-10-17",
        "12:00",
        "2026-10-17",
        "13:00",
        bookable,
      ),
    ).toBe(false)
  })

  test("multi-day only pins get-in to the first day and get-out to the last", () => {
    // Fri 19:00 → Sat 18:00 used to be checked as one 23h slot on Friday and
    // rejected; both endpoints are inside their own day's hours.
    expect(
      isBookingWindowAllowed(
        "2026-10-16",
        "19:00",
        "2026-10-17",
        "18:00",
        bookable,
      ),
    ).toBe(true)
    // Get-out after the previous night's close runs past midnight is fine.
    expect(
      isBookingWindowAllowed(
        "2026-10-16",
        "19:00",
        "2026-10-18",
        "02:00",
        bookable,
      ),
    ).toBe(true)
    // Get-in before Saturday opens, or get-out after Sunday closes, is not.
    expect(
      isBookingWindowAllowed(
        "2026-10-17",
        "12:00",
        "2026-10-18",
        "20:00",
        bookable,
      ),
    ).toBe(false)
    expect(
      isBookingWindowAllowed(
        "2026-10-17",
        "15:00",
        "2026-10-18",
        "23:00",
        bookable,
      ),
    ).toBe(false)
  })

  test("closed dates block either endpoint", () => {
    expect(
      isBookingWindowAllowed(
        "2026-12-22",
        "14:00",
        "2026-12-23",
        "18:00",
        bookable,
        [{ date: "2026-12-23" }],
      ),
    ).toBe(false)
  })
})
