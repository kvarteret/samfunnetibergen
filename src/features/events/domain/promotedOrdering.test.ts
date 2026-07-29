import { describe, expect, it } from "vitest"

import {
  comparePromotedEvents,
  isPromotableEventKind,
  promotedCardGridStartClass,
  selectHomepagePromotedEvents,
} from "./promotedOrdering"

describe("promoted event ordering", () => {
  it("allows only single events and series or festival parents", () => {
    expect(isPromotableEventKind("single")).toBe(true)
    expect(isPromotableEventKind("seriesParent")).toBe(true)
    expect(isPromotableEventKind("festivalParent")).toBe(true)
    expect(isPromotableEventKind("seriesInstance")).toBe(false)
    expect(isPromotableEventKind("festivalSession")).toBe(false)
  })

  it("keeps saved top membership stable instead of filling empty slots", () => {
    const events = [
      { orderRank: "0|a:", promotedPlacement: "top" as const },
      { orderRank: "0|b:", promotedPlacement: "pool" as const },
      { orderRank: "0|c:", promotedPlacement: "top" as const },
    ]

    expect(selectHomepagePromotedEvents(events, "2026-07-29")).toEqual([
      events[0],
      events[2],
    ])
  })

  it("centers one or two cards in the six-column homepage grid", () => {
    expect(promotedCardGridStartClass(1, 0)).toBe("md:col-start-3")
    expect(promotedCardGridStartClass(2, 0)).toBe("md:col-start-2")
    expect(promotedCardGridStartClass(2, 1)).toBeUndefined()
    expect(promotedCardGridStartClass(3, 0)).toBeUndefined()
  })

  it("uses editorial rank before date", () => {
    const events = [
      {
        orderRank: "0|b:",
        dates: [{ startDate: "2026-08-01" }],
      },
      {
        orderRank: "0|a:",
        dates: [{ startDate: "2026-09-01" }],
      },
    ]

    expect(
      events
        .sort((first, second) =>
          comparePromotedEvents(first, second, "2026-07-29"),
        )
        .map(event => event.orderRank),
    ).toEqual(["0|a:", "0|b:"])
  })

  it("places unranked events after ranked events and orders them by date", () => {
    const events = [
      { dates: [{ startDate: "2026-09-01" }] },
      { orderRank: "0|a:", dates: [{ startDate: "2026-10-01" }] },
      { dates: [{ startDate: "2026-08-01" }] },
    ]

    expect(
      events
        .sort((first, second) =>
          comparePromotedEvents(first, second, "2026-07-29"),
        )
        .map(event => event.dates[0]?.startDate),
    ).toEqual(["2026-10-01", "2026-08-01", "2026-09-01"])
  })
})
