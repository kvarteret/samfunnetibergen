import { describe, expect, it } from "vitest"

import { serializeEditorialRecurrence } from "./RecurringInput"

describe("editorial recurrence", () => {
  it("serializes ordinary controls to the stored recurrence rule", () => {
    expect(
      serializeEditorialRecurrence({
        frequency: "WEEKLY",
        weekdays: ["MO", "WE"],
        until: "2026-12-01",
      }),
    ).toBe("FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261201T235959Z")
  })
})
