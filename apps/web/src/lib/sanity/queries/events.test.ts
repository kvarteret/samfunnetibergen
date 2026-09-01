import { describe, expect, it } from "vitest"

import {
  eventBySlugQuery,
  promotedParentEventsQuery,
  publicEventBySlugQuery,
  publicEventChildrenQuery,
  publicEventsQuery,
  publishedEventSlugsQuery,
  publishedEventsQuery,
} from "./events"

describe("event detail query", () => {
  it("keeps every approved event reachable after its dates pass", () => {
    expect(eventBySlugQuery).toContain('approvalStatus == "approved"')
    expect(eventBySlugQuery).toContain("$preview == true")
    expect(eventBySlugQuery).not.toContain("count(dates[startDate >= $today])")
  })
})

describe("event status query contract", () => {
  it("keeps cancelled slugs reachable without supporting postponed", () => {
    expect(publishedEventSlugsQuery).toContain('eventStatus == "cancelled"')
    expect(publishedEventSlugsQuery).not.toContain("postponed")
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

describe("public events API query contract", () => {
  it("selects approved concrete occurrences by an inclusive range", () => {
    expect(publicEventsQuery).toContain('approvalStatus == "approved"')
    expect(publicEventsQuery).toContain("$from == null || startDate >= $from")
    expect(publicEventsQuery).toContain("$to == null || startDate <= $to")
    expect(publicEventsQuery).toContain("defined(slug.current)")
    expect(publicEventsQuery).toContain("$includeInternal == true")
    expect(publicEventsQuery).toContain("_updatedAt")
  })

  it("keeps historical detail and parent programs available to the service", () => {
    expect(publicEventBySlugQuery).toContain('approvalStatus == "approved"')
    expect(publicEventBySlugQuery).toContain("$from == null")
    expect(publicEventChildrenQuery).toContain("parentEvent._ref == $parentId")
    expect(publicEventChildrenQuery).toContain(
      'coalesce(eventKind, "single") in ["seriesInstance", "festivalSession"]',
    )
  })
})
