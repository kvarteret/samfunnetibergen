import { describe, expect, it } from "vitest"

import {
  getApprovalTransitions,
  getEventStatusTransitions,
} from "./approvalStatus"

describe("arrangement approval transitions", () => {
  it("allows pending arrangements to be approved or rejected", () => {
    expect(getApprovalTransitions("pending")).toEqual([
      {
        from: "pending",
        label: "Godkjenn og publiser",
        status: "approved",
        tone: "positive",
      },
      {
        from: "pending",
        label: "Avvis request",
        status: "rejected",
        tone: "critical",
      },
    ])
  })

  it("does not change approval status after approval", () => {
    expect(getApprovalTransitions("approved")).toEqual([])
  })

  it("only lets editors and administrators reopen rejected requests", () => {
    expect(getApprovalTransitions("rejected")).toEqual([])
    expect(getApprovalTransitions("rejected", ["viewer", "editor"])).toEqual([
      {
        from: "rejected",
        label: "Gjenåpne request",
        status: "pending",
        tone: "caution",
        roles: ["administrator", "editor"],
      },
    ])
    expect(getApprovalTransitions("rejected", ["administrator"])).toHaveLength(
      1,
    )
  })

  it("does not offer transitions for unknown states", () => {
    expect(getApprovalTransitions(undefined)).toEqual([])
  })
})

describe("arrangement event status transitions", () => {
  it("only allows approved arrangements to be cancelled", () => {
    expect(getEventStatusTransitions("approved", "scheduled")).toEqual([
      {
        from: "scheduled",
        label: "Kanseller arrangement",
        status: "cancelled",
        tone: "critical",
      },
    ])
    expect(getEventStatusTransitions("pending", "scheduled")).toEqual([])
  })

  it("only allows cancelled arrangements to return to approved", () => {
    expect(getEventStatusTransitions("approved", "cancelled")).toEqual([
      {
        from: "cancelled",
        label: "Gjenopprett som godkjent",
        status: "scheduled",
        tone: "positive",
      },
    ])
    expect(getEventStatusTransitions("approved", "postponed")).toEqual([])
  })

  it("treats a missing legacy event status as scheduled", () => {
    expect(getEventStatusTransitions("approved", undefined)).toHaveLength(1)
  })
})
