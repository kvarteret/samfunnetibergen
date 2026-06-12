import { describe, expect, it } from "vitest"

import { getApprovalTransitions } from "./approvalStatus"

describe("arrangement approval transitions", () => {
  it("allows pending arrangements to be approved or rejected", () => {
    expect(getApprovalTransitions("pending")).toEqual([
      { label: "Godkjenn", status: "approved", tone: "positive" },
      { label: "Avvis", status: "rejected", tone: "critical" },
    ])
  })

  it("allows approved arrangements to be paused", () => {
    expect(getApprovalTransitions("approved")).toEqual([
      { label: "Sett på pause", status: "paused", tone: "caution" },
    ])
  })

  it("allows paused arrangements to resume as approved", () => {
    expect(getApprovalTransitions("paused")).toEqual([
      { label: "Gjenoppta", status: "approved", tone: "positive" },
    ])
  })

  it("does not offer transitions for final or unknown states", () => {
    expect(getApprovalTransitions("rejected")).toEqual([])
    expect(getApprovalTransitions("archived")).toEqual([])
    expect(getApprovalTransitions(undefined)).toEqual([])
  })
})
