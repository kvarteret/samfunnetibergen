import { describe, expect, it } from "vitest"

import { PROMOTED_ARRANGEMENTS_FILTER } from "./promotedArrangementFilter"

describe("promoted arrangement list", () => {
  it("includes only approved promoted arrangements with upcoming dates", () => {
    expect(PROMOTED_ARRANGEMENTS_FILTER).toContain("isPromoted == true")
    expect(PROMOTED_ARRANGEMENTS_FILTER).toContain(
      'approvalStatus == "approved"',
    )
    expect(PROMOTED_ARRANGEMENTS_FILTER).toContain(
      "count(dates[startDate >= $today]) > 0",
    )
    expect(PROMOTED_ARRANGEMENTS_FILTER).toContain(
      'coalesce(eventKind, "single") in ["seriesParent", "festivalParent"]',
    )
  })
})
