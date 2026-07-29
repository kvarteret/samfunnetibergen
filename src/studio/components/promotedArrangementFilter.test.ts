import { describe, expect, it } from "vitest"

import {
  PROMOTED_ARRANGEMENTS_FILTER,
  PROMOTION_CANDIDATES_FILTER,
} from "./promotedArrangementFilter"

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
    expect(PROMOTED_ARRANGEMENTS_FILTER).toContain(
      'coalesce(eventKind, "single") in ["single", "seriesParent", "festivalParent"]',
    )
  })

  it("never offers individual series or festival days as candidates", () => {
    expect(PROMOTION_CANDIDATES_FILTER).toContain("isPromoted != true")
    expect(PROMOTION_CANDIDATES_FILTER).toContain(
      'coalesce(eventKind, "single") in ["single", "seriesParent", "festivalParent"]',
    )
    expect(PROMOTION_CANDIDATES_FILTER).not.toContain(
      '["seriesInstance", "festivalSession"]',
    )
  })
})
