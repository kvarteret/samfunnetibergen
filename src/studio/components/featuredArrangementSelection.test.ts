import { describe, expect, it } from "vitest"

import {
  reorderFeaturedDocuments,
  selectFeaturedDocuments,
  selectionNeedsNormalization,
} from "./featuredArrangementSelection"

describe("featured arrangement selection", () => {
  it("uses the explicit selection and limits it to three", () => {
    const documents = [
      { _id: "a", promotedPlacement: "top" as const, promotedOrder: 1 },
      { _id: "b", promotedPlacement: "pool" as const, promotedOrder: 0 },
      { _id: "c", promotedPlacement: "top" as const, promotedOrder: 0 },
      { _id: "d", promotedPlacement: "top" as const, promotedOrder: 2 },
      { _id: "e", promotedPlacement: "top" as const, promotedOrder: 3 },
    ]

    expect(
      selectFeaturedDocuments(documents).map(document => document._id),
    ).toEqual(["c", "a", "d"])
  })

  it("keeps the first three legacy promoted documents during migration", () => {
    const documents = [
      { _id: "a", isPromoted: true, orderRank: "0|b:" },
      { _id: "b", isPromoted: true, orderRank: "0|a:" },
      { _id: "c", isPromoted: false, orderRank: "0|c:" },
    ]

    expect(
      selectFeaturedDocuments(documents).map(document => document._id),
    ).toEqual(["b", "a"])
  })

  it("reorders only the selected list", () => {
    expect(reorderFeaturedDocuments(["a", "b", "c"], 2, 0)).toEqual([
      "c",
      "a",
      "b",
    ])
    expect(reorderFeaturedDocuments(["a", "b"], 0, 0)).toEqual(["a", "b"])
  })

  it("detects legacy and inconsistent selection fields", () => {
    const selected = [{ _id: "a", isPromoted: true }]
    expect(selectionNeedsNormalization(selected, selected)).toBe(true)
    expect(
      selectionNeedsNormalization(
        [
          {
            _id: "a",
            isPromoted: true,
            promotedPlacement: "top",
            promotedOrder: 0,
          },
        ],
        [
          {
            _id: "a",
            isPromoted: true,
            promotedPlacement: "top",
            promotedOrder: 0,
          },
        ],
      ),
    ).toBe(false)
  })
})
