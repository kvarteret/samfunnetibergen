import { describe, expect, it } from "vitest"

import { isScreenMushroomShow, isScreenPartyTime } from "./InfoScreenParty"

describe("isScreenPartyTime", () => {
  it("shows the mascots for the first two minutes of each quarter hour", () => {
    expect(isScreenPartyTime(new Date(2026, 9, 7, 18, 0, 0))).toBe(true)
    expect(isScreenPartyTime(new Date(2026, 9, 7, 18, 16, 59))).toBe(true)
    expect(isScreenPartyTime(new Date(2026, 9, 7, 18, 17, 0))).toBe(false)
    expect(isScreenPartyTime(new Date(2026, 9, 7, 18, 44, 0))).toBe(false)
    expect(isScreenPartyTime(new Date(2026, 9, 7, 18, 45, 30))).toBe(true)
  })
})

describe("isScreenMushroomShow", () => {
  it("brings a fluesopp to every fifth show", () => {
    const start = Date.UTC(2026, 9, 7, 0, 0)
    const shows = Array.from({ length: 10 }, (_, index) =>
      isScreenMushroomShow(new Date(start + index * 15 * 60_000 + 30_000)),
    )
    expect(shows.filter(Boolean)).toHaveLength(2)
    expect(
      shows.indexOf(true, shows.indexOf(true) + 1) - shows.indexOf(true),
    ).toBe(5)
  })
})
