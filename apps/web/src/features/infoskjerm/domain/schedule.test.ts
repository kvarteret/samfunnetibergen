import { describe, expect, it } from "vitest"
import {
  getScreenDate,
  isScreenEventExpired,
  type ScreenEvent,
} from "./schedule"

describe("the information screen's Oslo calendar date", () => {
  it.each([
    ["2026-09-30T21:59:59Z", "2026-09-30"],
    ["2026-09-30T22:00:00Z", "2026-10-01"],
    ["2026-12-31T22:59:59Z", "2026-12-31"],
    ["2026-12-31T23:00:00Z", "2027-01-01"],
    ["2026-03-29T00:59:59Z", "2026-03-29"],
    ["2026-03-29T01:00:00Z", "2026-03-29"],
  ])("maps %s to %s independently of the server timezone", (instant, date) => {
    expect(getScreenDate(new Date(instant))).toBe(date)
  })
})

describe("expired events", () => {
  const event = {
    startsAt: "2026-10-01T21:00:00Z",
    endsAt: "2026-10-02T00:00:00Z",
  } as ScreenEvent

  it("keeps overnight events active until their end, including the exact boundary", () => {
    expect(isScreenEventExpired(event, new Date("2026-10-01T23:59:59Z"))).toBe(
      false,
    )
    expect(isScreenEventExpired(event, new Date("2026-10-02T00:00:00Z"))).toBe(
      true,
    )
  })

  it("uses the start time when the end is unknown and keeps untimed events active", () => {
    const now = new Date("2026-10-01T22:00:00Z")
    expect(isScreenEventExpired({ ...event, endsAt: null }, now)).toBe(true)
    expect(
      isScreenEventExpired({ ...event, startsAt: null, endsAt: null }, now),
    ).toBe(false)
  })
})
