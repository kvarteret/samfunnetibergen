import { describe, expect, test } from "vitest"

import { resolveAssignmentDateTime } from "./datetime"

describe("resolveAssignmentDateTime", () => {
  test("keeps a pre-midnight assignment on the selected date", () => {
    expect(
      resolveAssignmentDateTime({
        startDate: "2026-08-29",
        startTime: "23:30",
        endTime: "00:30",
        assignmentTime: "23:45",
        dayIndex: 0,
      }),
    ).toBe("2026-08-29 23:45:00")
  })

  test("moves a post-midnight assignment to the following date", () => {
    expect(
      resolveAssignmentDateTime({
        startDate: "2026-08-29",
        startTime: "23:30",
        endTime: "00:30",
        assignmentTime: "00:15",
        dayIndex: 0,
      }),
    ).toBe("2026-08-30 00:15:00")
  })

  test("keeps an ordinary same-day assignment unchanged", () => {
    expect(
      resolveAssignmentDateTime({
        startDate: "2026-08-29",
        startTime: "18:00",
        endTime: "23:00",
        assignmentTime: "19:00",
        dayIndex: 0,
      }),
    ).toBe("2026-08-29 19:00:00")
  })

  test("uses the indexed date for an explicit multi-day booking", () => {
    expect(
      resolveAssignmentDateTime({
        startDate: "2026-08-29",
        endDate: "2026-08-30",
        startTime: "23:30",
        endTime: "00:30",
        assignmentTime: "00:15",
        dayIndex: 1,
      }),
    ).toBe("2026-08-30 00:15:00")
  })
})
