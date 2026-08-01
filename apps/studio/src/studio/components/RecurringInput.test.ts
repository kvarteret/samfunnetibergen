import { describe, expect, it } from "vitest"

import {
  documentOperationId,
  serializeEditorialRecurrence,
} from "./RecurringInput"

describe("editorial recurrence", () => {
  it("serializes ordinary controls to the stored recurrence rule", () => {
    expect(
      serializeEditorialRecurrence({
        frequency: "WEEKLY",
        interval: 2,
        weekdays: ["MO", "WE"],
      }),
    ).toBe("FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE")
  })

  it("uses the published id for document operations", () => {
    expect(documentOperationId("drafts.recurring-series")).toBe(
      "recurring-series",
    )
    expect(documentOperationId("recurring-series")).toBe("recurring-series")
  })
})
