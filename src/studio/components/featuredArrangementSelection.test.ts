import { describe, expect, it } from "vitest"

import {
  reorderFeaturedDocuments,
  selectFeaturedDocuments,
  selectionNeedsNormalization,
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

  it("requires queued selections after the first three to use pool placement", () => {
    const documents = ["a", "b", "c", "d"].map((_id, promotedOrder) => ({
      _id,
      isPromoted: true,
      promotedOrder,
      promotedPlacement: (promotedOrder < 3 ? "top" : "pool") as "top" | "pool",
    }))

    expect(selectionNeedsNormalization(documents, documents)).toBe(false)
    expect(
      selectionNeedsNormalization(
        documents.map(document =>
          document._id === "d"
            ? { ...document, promotedPlacement: "top" as const }
            : document,
        ),
        documents,
      ),
    ).toBe(true)
  })
})
