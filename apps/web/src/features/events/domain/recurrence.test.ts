import { describe, expect, test } from "vitest"

import {
  buildRecurrence,
  defaultRecurrenceRule,
  initialRecurrenceInput,
} from "./recurrence"

describe("recurrence cadence", () => {
  test("default rule has no independent end boundary", () => {
    expect(defaultRecurrenceRule).toContain("FREQ=WEEKLY")
    expect(defaultRecurrenceRule).not.toContain("COUNT")
    expect(defaultRecurrenceRule).not.toContain("UNTIL")
  })

  test("serializes frequency, interval, and weekdays only", () => {
    const recurrence = buildRecurrence({
      ...initialRecurrenceInput,
      interval: 2,
      weekdays: [0, 2],
    })

    expect(recurrence?.rule).toContain("FREQ=WEEKLY")
    expect(recurrence?.rule).toContain("INTERVAL=2")
    expect(recurrence?.rule).toContain("BYDAY=MO,WE")
    expect(recurrence?.rule).not.toContain("COUNT")
    expect(recurrence?.rule).not.toContain("UNTIL")
  })
})
