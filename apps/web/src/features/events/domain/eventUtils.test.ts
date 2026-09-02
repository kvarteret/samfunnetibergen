import { describe, expect, it } from "vitest"

import type { PublicEvent } from "./public-events"
import { filterToFirstInstances } from "./eventUtils"

function event(id: string, kind: PublicEvent["eventKind"], parentId?: string) {
  return {
    _id: id,
    eventKind: kind,
    parentEvent: parentId
      ? { _id: parentId, slug: `${parentId}-slug`, title: parentId }
      : null,
  } as unknown as PublicEvent
}

describe("first materialized event instances", () => {
  it("keeps only the first child for each series or festival", () => {
    const events = [
      event("series-first", "seriesInstance", "series"),
      event("festival-first", "festivalSession", "festival"),
      event("series-later", "seriesInstance", "series"),
      event("festival-later", "festivalSession", "festival"),
    ]

    expect(filterToFirstInstances(events).map(item => item._id)).toEqual([
      "series-first",
      "festival-first",
    ])
  })

  it("keeps ordinary events and preserves their input order", () => {
    const events = [
      event("single", "single"),
      event("series", "seriesInstance", "series"),
      event("another-single", "single"),
      event("festival", "festivalSession", "festival"),
    ]

    expect(filterToFirstInstances(events).map(item => item._id)).toEqual([
      "single",
      "series",
      "another-single",
      "festival",
    ])
  })

  it("does not merge children belonging to different parents", () => {
    const events = [
      event("series-a-first", "seriesInstance", "series-a"),
      event("series-b-first", "seriesInstance", "series-b"),
    ]

    expect(filterToFirstInstances(events).map(item => item._id)).toEqual([
      "series-a-first",
      "series-b-first",
    ])
  })
})
