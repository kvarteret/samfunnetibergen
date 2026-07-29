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
  it("derives festival dates from approved festival days", () => {
    expect(promotedParentEventsQuery).toContain(
      'eventKind == "festivalSession"',
    )
    expect(promotedParentEventsQuery).toContain('approvalStatus == "approved"')
    expect(promotedParentEventsQuery).toContain("parentEvent._ref == ^._id")
    expect(publishedEventsQuery).toContain(
      '"useFestivalImage": coalesce(useFestivalImage, true)',
    )
  })
})
