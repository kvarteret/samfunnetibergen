import { describe, expect, it } from "vitest"

import {
  decidePromotedDrag,
  placementsAfterDecision,
  topDocumentIds,
  type PromotedPlacementDocument,
} from "./promotedArrangementPlacement"

function docs(
  values: Array<[string, "top" | "pool" | undefined]>,
): PromotedPlacementDocument[] {
  return values.map(([id, promotedPlacement], index) => ({
    _id: id,
    orderRank: `${index}`,
    promotedPlacement,
  }))
}

describe("promoted arrangement placement", () => {
  it("treats the first three legacy documents as the top group", () => {
    expect([
      ...topDocumentIds(
        docs([
          ["a", undefined],
          ["b", undefined],
        ]),
      ),
    ]).toEqual(["a", "b"])
  })

  it("moves only the dragged top item below the line", () => {
    const before = docs([
      ["a", "top"],
      ["b", "top"],
      ["c", "pool"],
    ])
    const after = [before[1]!, before[2]!, before[0]!]
    const decision = decidePromotedDrag(before, after, "a")

    expect(decision).toEqual({
      type: "move",
      draggedId: "a",
      placement: "pool",
    })
    expect(
      decision.type === "move" ? placementsAfterDecision(before, decision) : [],
    ).toEqual([
      { id: "a", placement: "pool" },
      { id: "b", placement: "top" },
      { id: "c", placement: "pool" },
    ])
  })

  it("moves only the dragged pool item above the line", () => {
    const before = docs([
      ["a", "top"],
      ["b", "top"],
      ["c", "pool"],
    ])
    const after = [before[0]!, before[2]!, before[1]!]

    expect(decidePromotedDrag(before, after, "c")).toEqual({
      type: "move",
      draggedId: "c",
      placement: "top",
    })
  })

  it("rejects a fourth item above the line", () => {
    const before = docs([
      ["a", "top"],
      ["b", "top"],
      ["c", "top"],
      ["d", "pool"],
    ])
    const after = [before[0]!, before[3]!, before[1]!, before[2]!]

    expect(decidePromotedDrag(before, after, "d")).toEqual({
      type: "rejectMaximum",
    })
  })

  it("rejects moving the final top item below the line", () => {
    const before = docs([
      ["a", "top"],
      ["b", "pool"],
    ])
    const after = [before[1]!, before[0]!]

    expect(decidePromotedDrag(before, after, "a")).toEqual({
      type: "rejectMinimum",
    })
  })
})
