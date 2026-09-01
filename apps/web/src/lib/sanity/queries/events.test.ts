import { describe, expect, it } from "vitest"

import {
  previewEventBySlugQuery,
  previewEventChildrenQuery,
  publicEventBySlugQuery,
  publicEventChildrenQuery,
  publicEventsQuery,
  publicPromotedParentEventsQuery,
  publishedEventSlugsQuery,
} from "./events"

describe("event detail query", () => {
  it("keeps every approved event reachable after its dates pass", () => {
    expect(previewEventBySlugQuery).toContain('approvalStatus == "approved"')
    expect(previewEventBySlugQuery).toContain("$preview == true")
    expect(previewEventBySlugQuery).not.toContain(
      "count(dates[startDate >= $today])",
    )
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
    expect(previewEventChildrenQuery).toContain(
      'eventKind in ["seriesInstance", "festivalSession"]',
    )
    expect(previewEventChildrenQuery).toContain('approvalStatus == "approved"')
    expect(previewEventChildrenQuery).toContain("parentEvent._ref == $parentId")
    expect(publicEventsQuery).toContain(
      '"useFestivalImage": coalesce(useFestivalImage, true)',
    )
  })
})

describe("promoted ordering", () => {
  it("projects editorial order and excludes parents without upcoming days", () => {
    expect(publicPromotedParentEventsQuery).toContain("orderRank")
    expect(publicPromotedParentEventsQuery).toContain(
      "count(dates[defined(startDate) && ($from == null || startDate >= $from)",
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

  it("keeps homepage promotion on the same public projection", () => {
    expect(publicPromotedParentEventsQuery).toContain("isPromoted == true")
    expect(publicPromotedParentEventsQuery).toContain(
      "$includeInternal == true",
    )
    expect(publicPromotedParentEventsQuery).toContain(
      "$from == null || startDate >= $from",
    )
  })

  it("keeps internal events out of public sitemap slugs", () => {
    expect(publishedEventSlugsQuery).toContain(
      "coalesce(isInternalEvent, parentEvent->isInternalEvent, false) != true",
    )
  })
})
