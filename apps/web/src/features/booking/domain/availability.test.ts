import { describe, expect, test } from "vitest"
import type { CresatBooking } from "@/lib/integrations/crescat/calendar"
import {
  availabilityWindow,
  calendarBookingStatus,
  canFitBookingSpan,
  isRoomOccupied,
  occupiedMinuteRanges,
} from "./availability"

const booking: CresatBooking = {
  id: 394377,
  resourceId: 96,
  event_id: 310742,
  start: "2026-09-10T11:00:00",
  end: "2026-09-10T17:30:00",
  color: "",
  title: "Test booking",
  part_of_event: false,
}

describe("canFitBookingSpan", () => {
  const hours = [{ startMin: 12 * 60, endMin: 24 * 60 }]
  test("allows squeezing endpoint hours around adjacent bookings", () => {
    expect(
      canFitBookingSpan(
        [
          { start: "2026-10-15T12:00:00", end: "2026-10-15T20:00:00" },
          { start: "2026-10-17T16:00:00", end: "2026-10-17T23:00:00" },
        ],
        "2026-10-15",
        "2026-10-17",
        hours,
        hours,
      ),
    ).toBe(true)
  })
  test("blocks a collision on an intermediate day", () => {
    expect(
      canFitBookingSpan(
        [{ start: "2026-10-16T17:00:00", end: "2026-10-16T18:00:00" }],
        "2026-10-15",
        "2026-10-17",
        hours,
        hours,
      ),
    ).toBe(false)
  })
  test("blocks an overnight collision that spans every possible endpoint", () => {
    expect(
      canFitBookingSpan(
        [{ start: "2026-10-15T23:00:00", end: "2026-10-16T13:00:00" }],
        "2026-10-15",
        "2026-10-16",
        hours,
        hours,
      ),
    ).toBe(false)
  })
  test("requires a full hour of continuous free time", () => {
    const bookings = [
      { start: "2026-10-15T13:00:00", end: "2026-10-16T00:00:00" },
    ]
    expect(
      canFitBookingSpan(bookings, "2026-10-15", "2026-10-15", hours, hours),
    ).toBe(true)
    bookings[0].start = "2026-10-15T12:45:00"
    expect(
      canFitBookingSpan(bookings, "2026-10-15", "2026-10-15", hours, hours),
    ).toBe(false)
  })
  test("checks all selected rooms together", () => {
    expect(
      canFitBookingSpan(
        [
          { start: "2026-10-15T12:00:00", end: "2026-10-15T18:00:00" },
          { start: "2026-10-15T18:00:00", end: "2026-10-16T00:00:00" },
        ],
        "2026-10-15",
        "2026-10-15",
        hours,
        hours,
      ),
    ).toBe(false)
  })
})

describe("isRoomOccupied", () => {
  test("keeps an adjacent Norwegian civil-time slot available", () => {
    expect(isRoomOccupied([booking], 96, "2026-09-10", "18:00", "22:00")).toBe(
      false,
    )
  })

  test("still detects an actual overlap", () => {
    expect(isRoomOccupied([booking], 96, "2026-09-10", "17:00", "18:00")).toBe(
      true,
    )
  })
})

const dayHours = [{ startMin: 12 * 60, endMin: 23 * 60 }]
const reservation = (start: string, end: string) => ({
  start: `2026-10-28T${start}:00`,
  end: `2026-10-28T${end}:00`,
})

describe("calendarBookingStatus", () => {
  test("marks a partially occupied day without blocking the available hours", () => {
    expect(
      calendarBookingStatus(
        [reservation("16:00", "22:00")],
        "2026-10-28",
        dayHours,
      ),
    ).toEqual({ occupied: true, fullyOccupied: false })
  })
  test("blocks a day filled by adjacent and overlapping reservations", () => {
    expect(
      calendarBookingStatus(
        [reservation("17:00", "23:00"), reservation("12:00", "18:00")],
        "2026-10-28",
        dayHours,
      ),
    ).toEqual({ occupied: true, fullyOccupied: true })
  })
  test("keeps a gap between reservations available", () => {
    expect(
      calendarBookingStatus(
        [reservation("12:00", "17:00"), reservation("17:15", "23:00")],
        "2026-10-28",
        dayHours,
      ).fullyOccupied,
    ).toBe(false)
  })
  test("ignores reservations outside bookable hours", () => {
    expect(
      calendarBookingStatus(
        [reservation("08:00", "12:00")],
        "2026-10-28",
        dayHours,
      ),
    ).toEqual({ occupied: false, fullyOccupied: false })
  })
  test("includes overnight occupancy in the room's closing hours", () => {
    expect(
      calendarBookingStatus(
        [{ start: "2026-10-28T18:00:00", end: "2026-10-29T03:00:00" }],
        "2026-10-28",
        [{ startMin: 18 * 60, endMin: 27 * 60 }],
      ).fullyOccupied,
    ).toBe(true)
  })
  test("handles bookings crossing into the day from an earlier date", () => {
    expect(
      calendarBookingStatus(
        [{ start: "2026-10-27T12:00:00", end: "2026-10-29T03:00:00" }],
        "2026-10-28",
        dayHours,
      ).fullyOccupied,
    ).toBe(true)
  })
})

describe("availabilityWindow", () => {
  test("covers both displayed months and their final overnight close", () => {
    expect(availabilityWindow("2026-10-01", "", "")).toEqual({
      start: "2026-10-01",
      end: "2026-12-02",
    })
  })
  test("keeps the selected booking covered when browsing other months", () => {
    expect(
      availabilityWindow("2026-12-01", "2026-10-28", "2026-10-31"),
    ).toEqual({ start: "2026-10-28", end: "2027-02-02" })
    expect(
      availabilityWindow("2026-10-01", "2027-01-28", "2027-02-02"),
    ).toEqual({ start: "2026-10-01", end: "2027-02-04" })
  })
})

test("slider occupancy only includes the selected room", () => {
  expect(
    occupiedMinuteRanges(
      [
        {
          ...booking,
          resourceId: 96,
          start: "2026-10-28T16:00:00",
          end: "2026-10-28T22:00:00",
        },
        {
          ...booking,
          resourceId: 97,
          start: "2026-10-28T12:00:00",
          end: "2026-10-28T23:00:00",
        },
      ],
      [96],
      "2026-10-28",
      "2026-10-28",
    ),
  ).toEqual([{ startMin: 960, endMin: 1320 }])
})
