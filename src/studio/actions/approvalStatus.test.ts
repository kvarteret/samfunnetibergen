import { describe, expect, it } from "vitest"

import { getApprovalTransitions } from "./approvalStatus"

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

  it("allows approved arrangements to be hidden or archived", () => {
    expect(getApprovalTransitions("approved")).toEqual([
      {
        from: "approved",
        label: "Skjul midlertidig",
        status: "paused",
        tone: "caution",
      },
      {
        from: "approved",
        label: "Arkiver",
        status: "archived",
        tone: "critical",
      },
    ])
  })

  it("allows hidden and archived arrangements to return", () => {
    expect(getApprovalTransitions("paused")).toEqual([
      {
        from: "paused",
        label: "Gjør synlig",
        status: "approved",
        tone: "positive",
      },
      {
        from: "paused",
        label: "Arkiver",
        status: "archived",
        tone: "critical",
      },
    ])
    expect(getApprovalTransitions("archived")).toEqual([
      {
        from: "archived",
        label: "Gjenopprett og publiser",
        status: "approved",
        tone: "positive",
      },
    ])
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
