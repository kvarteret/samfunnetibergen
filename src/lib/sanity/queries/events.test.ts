import { describe, expect, it } from "vitest"

import { eventBySlugQuery } from "./events"

describe("event detail query", () => {
  it("keeps every approved event reachable after its dates pass", () => {
    expect(eventBySlugQuery).toContain('approvalStatus == "approved"')
    expect(eventBySlugQuery).toContain("$preview == true")
    expect(eventBySlugQuery).not.toContain("count(dates[startDate >= $today])")
  })
})
