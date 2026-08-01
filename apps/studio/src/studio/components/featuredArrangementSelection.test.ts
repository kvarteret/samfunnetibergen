import { describe, expect, it } from "vitest"

import {
  applyFeaturedSelection,
  getFeaturedVisibleCount,
  moveFeaturedDocumentBetweenSections,
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

  it("moves a visible event into the queue when dropped across the divider", () => {
    expect(
      moveFeaturedDocumentBetweenSections(
        ["a", "b", "c", "d"],
        3,
        "visible",
        2,
        "queue",
        0,
      ),
    ).toEqual({ documents: ["a", "b", "c", "d"], visibleCount: 2 })
    expect(
      moveFeaturedDocumentBetweenSections(
        ["a", "b", "c", "d", "e"],
        3,
        "visible",
        0,
        "queue",
        1,
      ),
    ).toEqual({
      documents: ["b", "c", "d", "a", "e"],
      visibleCount: 2,
    })
  })

  it("keeps the visible group capped when a queued event is dragged up", () => {
    const documents = ["a", "b", "c", "d"]
    expect(
      moveFeaturedDocumentBetweenSections(
        documents,
        3,
        "queue",
        0,
        "visible",
        2,
      ),
    ).toEqual({ documents, visibleCount: 3 })
  })

  it("preserves an explicit visible count between one and three", () => {
    expect(
      getFeaturedVisibleCount([
        { _id: "a", promotedPlacement: "top" },
        { _id: "b", promotedPlacement: "pool" },
      ]),
    ).toBe(1)
    expect(
      getFeaturedVisibleCount([
        { _id: "a", promotedPlacement: "pool" },
        { _id: "b", promotedPlacement: "pool" },
      ]),
    ).toBe(1)
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

  it("applies visible and queued positions without waiting for a refetch", () => {
    const documents = ["a", "b", "c", "d", "e"].map(_id => ({
      _id,
      isPromoted: false,
    }))
    const selected = [documents[2], documents[0], documents[4], documents[3]]

    expect(applyFeaturedSelection(documents, selected)).toEqual([
      {
        _id: "a",
        isPromoted: true,
        promotedOrder: 1,
        promotedPlacement: "top",
      },
      {
        _id: "b",
        isPromoted: false,
        promotedOrder: undefined,
        promotedPlacement: "pool",
      },
      {
        _id: "c",
        isPromoted: true,
        promotedOrder: 0,
        promotedPlacement: "top",
      },
      {
        _id: "d",
        isPromoted: true,
        promotedOrder: 3,
        promotedPlacement: "pool",
      },
      {
        _id: "e",
        isPromoted: true,
        promotedOrder: 2,
        promotedPlacement: "top",
      },
    ])
  })

  it("keeps manually queued events below a two-item visible group", () => {
    const documents = ["a", "b", "c"].map(_id => ({
      _id,
      isPromoted: false,
    }))
    expect(applyFeaturedSelection(documents, documents, 2)).toEqual([
      {
        _id: "a",
        isPromoted: true,
        promotedOrder: 0,
        promotedPlacement: "top",
      },
      {
        _id: "b",
        isPromoted: true,
        promotedOrder: 1,
        promotedPlacement: "top",
      },
      {
        _id: "c",
        isPromoted: true,
        promotedOrder: 2,
        promotedPlacement: "pool",
      },
    ])
  })
})
