import { describe, expect, it } from "vitest"

import { closedApplicationStatus } from "./applicationStatus"

describe("closedApplicationStatus", () => {
  it("returns the closed reason for closed groups", () => {
    expect(closedApplicationStatus("external")).toBe("external")
    expect(closedApplicationStatus("full")).toBe("full")
  })

  it("treats open, missing, and unknown values as open", () => {
    expect(closedApplicationStatus("open")).toBeNull()
    expect(closedApplicationStatus(null)).toBeNull()
    expect(closedApplicationStatus(undefined)).toBeNull()
    expect(closedApplicationStatus("something-else")).toBeNull()
  })
})
