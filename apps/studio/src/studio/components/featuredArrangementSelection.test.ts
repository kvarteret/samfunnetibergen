import { describe, expect, it } from "vitest"

import {
  changedPromotions,
  promotionState,
  reorderFeaturedDocuments,
  selectFeaturedDocuments,
} from "./featuredArrangementSelection"

describe("featured arrangement selection", () => {
  it("keeps the complete promoted queue in its dedicated order", () => {
    const documents = [
      {
        _id: "a",
        isPromoted: true,
        promotedPlacement: "top" as const,
        promotedOrder: 1,
      },
      {
        _id: "b",
        isPromoted: true,
        promotedPlacement: "pool" as const,
        promotedOrder: 3,
      },
      { _id: "c", promotedPlacement: "top" as const, promotedOrder: 0 },
      {
        _id: "d",
        isPromoted: true,
        promotedPlacement: "top" as const,
        promotedOrder: 2,
      },
      {
        _id: "e",
        isPromoted: true,
        promotedPlacement: "top" as const,
        promotedOrder: 0,
      },
    ]

    expect(
      selectFeaturedDocuments(documents).map(document => document._id),
    ).toEqual(["e", "a", "d", "b"])
  })

  it("keeps every legacy promoted document during migration", () => {
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

  it("stores the first three picks as top and the rest as waiting", () => {
    const ids = ["a", "b", "c", "d"]
    expect(promotionState(ids, "drafts.a")).toEqual({
      isPromoted: true,
      promotedOrder: 0,
      promotedPlacement: "top",
    })
    expect(promotionState(ids, "d")).toEqual({
      isPromoted: true,
      promotedOrder: 3,
      promotedPlacement: "pool",
    })
    expect(promotionState(ids, "x")).toEqual({
      isPromoted: false,
      promotedPlacement: "pool",
    })
  })

  it("patches only arrangements whose promotion fields change", () => {
    const documents = [
      {
        _id: "a",
        isPromoted: true,
        promotedOrder: 0,
        promotedPlacement: "top" as const,
      },
      {
        _id: "b",
        isPromoted: true,
        promotedOrder: 1,
        promotedPlacement: "top" as const,
      },
      { _id: "c", isPromoted: false, promotedPlacement: "pool" as const },
      { _id: "legacy", isPromoted: false, promotedPlacement: "top" as const },
    ]
    expect(
      changedPromotions(documents, ["b", "a"]).map(({ document, state }) => [
        document._id,
        state.promotedOrder ?? null,
      ]),
    ).toEqual([
      ["a", 1],
      ["b", 0],
      ["legacy", null],
    ])
    expect(changedPromotions(documents.slice(0, 3), ["a", "b"])).toEqual([])
  })
})
