import { describe, expect, it } from "vitest"

import {
  type AutoPromotionCandidate,
  isAutoPromotable,
  pickAutoPromotions,
} from "./promotion"

const today = "2026-10-25"

function candidate(
  _id: string,
  startDate: string,
  extra: Partial<AutoPromotionCandidate> = {},
): AutoPromotionCandidate {
  return {
    _id,
    eventKind: "single",
    hasImage: true,
    dates: [{ startDate, startTime: "20:00" }],
    ...extra,
  }
}

describe("isAutoPromotable", () => {
  it("skips cancelled, sold-out, past and child arrangements", () => {
    expect(isAutoPromotable(candidate("a", "2026-10-26"), today)).toBe(true)
    expect(
      isAutoPromotable(
        candidate("a", "2026-10-26", { eventStatus: "cancelled" }),
        today,
      ),
    ).toBe(false)
    expect(
      isAutoPromotable(
        candidate("a", "2026-10-26", { isSoldOut: true }),
        today,
      ),
    ).toBe(false)
    expect(
      isAutoPromotable(
        candidate("a", "2026-10-26", {
          dates: [{ startDate: "2026-10-26", isSoldOut: true }],
        }),
        today,
      ),
    ).toBe(false)
    expect(isAutoPromotable(candidate("a", "2026-10-24"), today)).toBe(false)
    expect(
      isAutoPromotable(
        candidate("a", "2026-10-26", { eventKind: "seriesInstance" }),
        today,
      ),
    ).toBe(false)
  })

  it("accepts short series runs but not semester-long weekly series", () => {
    const run = candidate("run", "2026-10-28", {
      eventKind: "seriesParent",
      dates: ["2026-10-28", "2026-10-30", "2026-11-04"].map(startDate => ({
        startDate,
      })),
    })
    const weekly = candidate("weekly", "2026-10-28", {
      eventKind: "seriesParent",
      dates: ["2026-10-28", "2026-11-04", "2026-11-11", "2026-11-18"].map(
        startDate => ({ startDate }),
      ),
    })
    expect(isAutoPromotable(run, today)).toBe(true)
    expect(isAutoPromotable(weekly, today)).toBe(false)
  })
})

describe("pickAutoPromotions", () => {
  it("picks the soonest upcoming arrangements", () => {
    const picked = pickAutoPromotions(
      [
        candidate("later", "2026-11-10"),
        candidate("soon", "2026-10-26"),
        candidate("next", "2026-10-29"),
        candidate("past", "2026-10-20"),
        candidate("mid", "2026-11-01"),
      ],
      { count: 3, today },
    )
    expect(picked.map(event => event._id)).toEqual(["soon", "next", "mid"])
  })

  it("leaves out manually chosen arrangements and fills only the open slots", () => {
    const picked = pickAutoPromotions(
      [
        candidate("manual", "2026-10-26"),
        candidate("a", "2026-10-27"),
        candidate("b", "2026-10-28"),
      ],
      { count: 1, excludeIds: ["manual"], today },
    )
    expect(picked.map(event => event._id)).toEqual(["a"])
    expect(
      pickAutoPromotions([candidate("a", "2026-10-27")], { count: 0, today }),
    ).toEqual([])
  })

  it("prefers arrangements with images and spreads organizers", () => {
    const picked = pickAutoPromotions(
      [
        candidate("no-image", "2026-10-26", { hasImage: false }),
        candidate("club-1", "2026-10-27", { organizerId: "club" }),
        candidate("club-2", "2026-10-28", { organizerId: "club" }),
        candidate("other", "2026-11-05", { organizerId: "other" }),
        candidate("third", "2026-11-06"),
      ],
      { count: 3, today },
    )
    expect(picked.map(event => event._id)).toEqual(["club-1", "other", "third"])
  })

  it("relaxes preferences rather than leaving a slot empty", () => {
    const picked = pickAutoPromotions(
      [
        candidate("no-image", "2026-10-26", { hasImage: false }),
        candidate("club-1", "2026-10-27", { organizerId: "club" }),
        candidate("club-2", "2026-10-28", { organizerId: "club" }),
      ],
      { count: 3, today },
    )
    expect(picked.map(event => event._id)).toEqual([
      "club-1",
      "club-2",
      "no-image",
    ])
  })
})
