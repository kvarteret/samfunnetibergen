import { describe, expect, it } from "vitest"
import { interestLevel, interestWeight, validTaps } from "./interest"

describe("event enthusiasm", () => {
  it("escalates through three weighted levels without inflating attendees", () => {
    expect([0, 1, 3, 4, 7, 8, 12].map(interestLevel)).toEqual([
      0, 1, 1, 2, 2, 3, 3,
    ])
    expect([0, 1, 4, 8, 12].map(interestWeight)).toEqual([0, 0.25, 0.75, 1, 1])
  })
  it("rejects fractional, overflowing and non-numeric taps", () => {
    for (const value of [-1, 13, 1.5, "1", null, NaN, Infinity, true])
      expect(validTaps(value)).toBe(false)
    expect(validTaps(0)).toBe(true)
    expect(validTaps(12)).toBe(true)
  })
})
