import { describe, expect, test } from "vitest"
import { cleanOpeningHours } from "./shared"
import { encodeStegaForTest as encoded } from "./test-stega"

describe("opening-hours Stega normalization", () => {
  test("cleans control fields while preserving editable display text", () => {
    const note = encoded("Kun ved arrangement")
    const hours = cleanOpeningHours({
      rows: [
        {
          status: encoded("open"),
          duration: {
            start: encoded("18:00"),
            end: encoded("03:00"),
          },
          note,
        },
      ],
    })

    expect(hours.rows[0]).toMatchObject({
      status: "open",
      duration: { start: "18:00", end: "03:00" },
    })
    expect(hours.rows[0].note).toBe(note)
    expect(hours.rows[0].note).not.toBe("Kun ved arrangement")
  })

  test("preserves null and undefined opening-hours values", () => {
    expect(cleanOpeningHours(null)).toBeNull()
    expect(cleanOpeningHours(undefined)).toBeUndefined()
  })
})
