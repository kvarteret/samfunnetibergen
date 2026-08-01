import { describe, expect, it } from "vitest"

import {
  eventBySlugQuery,
  promotedParentEventsQuery,
  publishedEventsQuery,
} from "./events"

describe("event detail query", () => {
  it("keeps every approved event reachable after its dates pass", () => {
    expect(eventBySlugQuery).toContain('approvalStatus == "approved"')
    expect(eventBySlugQuery).toContain("$preview == true")
    expect(eventBySlugQuery).not.toContain("count(dates[startDate >= $today])")
  })
})

describe("festival projections", () => {
  it("derives parent dates from approved series and festival days", () => {
    expect(promotedParentEventsQuery).toContain(
      'eventKind in ["seriesInstance", "festivalSession"]',
    )
    expect(promotedParentEventsQuery).toContain('approvalStatus == "approved"')
    expect(promotedParentEventsQuery).toContain("parentEvent._ref == ^._id")
    expect(publishedEventsQuery).toContain(
      '"useFestivalImage": coalesce(useFestivalImage, true)',
    )
  })
})

describe("promoted ordering", () => {
  it("projects editorial order and excludes parents without upcoming days", () => {
    expect(promotedParentEventsQuery).toContain("orderRank")
    expect(promotedParentEventsQuery).toContain(
      "count(dates[startDate >= $today]) > 0",
    )
  })
})
