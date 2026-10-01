import { describe, expect, it } from "vitest"
import {
  interestLevel,
  validBatchId,
  validClicks,
  validInterest,
} from "./interest"

describe("event enthusiasm", () => {
  it("validates recorded totals independently of expression thresholds", () => {
    expect([0, 1, 3, 4, 7, 8, 12, 130].map(interestLevel)).toEqual([
      0, 1, 1, 2, 2, 3, 3, 3,
    ])
    expect(validInterest({ taps: 130, count: 11260 })).toBe(true)
  })
  it("bounds batches while allowing more than twelve clicks", () => {
    for (const value of [-1, 0, 1001, 1.5, "1", null, NaN, Infinity, true])
      expect(validClicks(value)).toBe(false)
    for (const value of [1, 13, 1000]) expect(validClicks(value)).toBe(true)
    expect(validBatchId("550e8400-e29b-41d4-a716-446655440000")).toBe(true)
    expect(validBatchId("not-a-uuid")).toBe(false)
  })
  it("rejects malformed totals instead of displaying a false count", () => {
    for (const value of [
      null,
      { taps: 1, count: 0.25 },
      { taps: 2, count: 1 },
      { taps: -1, count: 5 },
      { taps: 1, count: Infinity },
      { taps: 1, count: Number.MAX_SAFE_INTEGER + 1 },
    ])
      expect(validInterest(value)).toBe(false)
  })
})
