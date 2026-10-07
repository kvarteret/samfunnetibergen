import { describe, expect, test } from "vitest"
import { ticketCoSlot } from "./schedule"

describe("Wednesday and Saturday imports in Oslo", () => {
  test.each([
    ["2026-07-08T03:59:00Z", null],
    ["2026-07-08T04:00:00Z", "2026-07-08"],
    ["2026-01-07T04:59:00Z", null],
    ["2026-01-07T05:00:00Z", "2026-01-07"],
    ["2026-07-11T15:59:00Z", null],
    ["2026-07-11T16:00:00Z", "2026-07-11"],
    ["2026-01-10T16:59:00Z", null],
    ["2026-01-10T17:00:00Z", "2026-01-10"],
    ["2026-10-24T16:00:00Z", "2026-10-24"],
    ["2026-10-28T05:00:00Z", "2026-10-28"],
    ["2026-07-12T16:00:00Z", null],
    ["2026-07-06T05:00:00Z", null],
  ])("%s maps to %s", (date, expected) =>
    expect(ticketCoSlot(new Date(date))).toBe(expected),
  )
})
