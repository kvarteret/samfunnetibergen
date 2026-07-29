import { describe, expect, it } from "vitest"

import { comparePromotedEvents } from "./promotedOrdering"

describe("promoted event ordering", () => {
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
