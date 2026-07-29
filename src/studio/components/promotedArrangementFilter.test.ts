import { describe, expect, it } from "vitest"

import { PROMOTABLE_ARRANGEMENTS_FILTER } from "./promotedArrangementFilter"

describe("featured arrangement eligibility", () => {
  it("allows only approved top-level arrangements with upcoming dates", () => {
    expect(PROMOTABLE_ARRANGEMENTS_FILTER).toContain(
      'approvalStatus == "approved"',
    )
    expect(PROMOTABLE_ARRANGEMENTS_FILTER).toContain(
      'coalesce(eventKind, "single") in ["single", "seriesParent", "festivalParent"]',
    )
    expect(PROMOTABLE_ARRANGEMENTS_FILTER).toContain(
      "parentEvent._ref == string::split(^._id",
    )
    expect(PROMOTABLE_ARRANGEMENTS_FILTER).toContain(
      "count(dates[startDate >= $today]) > 0",
    )
    expect(PROMOTABLE_ARRANGEMENTS_FILTER).not.toContain(
      '["seriesInstance", "festivalSession"]',
    )
  })
})
