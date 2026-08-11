import { describe, expect, it } from "vitest"

import {
  deriveArrangementDocumentStatus,
  editableArrangementStatuses,
} from "./ArrangementDocumentInput"

const document = {
  _id: "event",
  _type: "arrangement",
  _createdAt: "2026-01-01T00:00:00Z",
  _updatedAt: "2026-01-01T00:00:00Z",
  _rev: "rev",
  approvalStatus: "approved",
  eventStatus: "scheduled",
}

describe("arrangement document status input", () => {
  it("allows only approved to cancelled and cancelled to approved", () => {
    expect(editableArrangementStatuses(document, "approved")).toEqual([
      "approved",
      "cancelled",
    ])
    expect(
      editableArrangementStatuses(
        { ...document, eventStatus: "cancelled" },
        "cancelled",
      ),
    ).toEqual(["cancelled", "approved"])
  })

  it.each([
    "completed",
    "archived",
  ] as const)("keeps derived %s read-only", status => {
    expect(editableArrangementStatuses(document, status)).toEqual([status])
  })

  it("uses the latest approved child date for a parent", () => {
    expect(
      deriveArrangementDocumentStatus(
        { ...document, eventKind: "festivalParent" },
        {
          childDates: ["2026-08-10", "2026-08-15"],
          parentStatus: "scheduled",
        },
        "2026-08-11",
      ),
    ).toBe("approved")
  })

  it("shows inherited parent cancellation on a child", () => {
    expect(
      deriveArrangementDocumentStatus(
        {
          ...document,
          eventKind: "festivalSession",
          dates: [{ startDate: "2026-08-12" }],
        },
        { childDates: [], parentStatus: "cancelled" },
        "2026-08-11",
      ),
    ).toBe("cancelled")
  })
})
