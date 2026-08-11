import { describe, expect, it } from "vitest"

import { buildArrangementStatusPatch } from "./arrangementStatuses"

describe("arrangement status normalization", () => {
  it("backfills missing event status and chooses approval by origin", () => {
    expect(
      buildArrangementStatusPatch({ _id: "direct", _type: "arrangement" }),
    ).toEqual({ approvalStatus: "approved", eventStatus: "scheduled" })
    expect(
      buildArrangementStatusPatch({
        _id: "request",
        _type: "arrangement",
        submittedByEmail: "sender@example.com",
      }),
    ).toEqual({ approvalStatus: "pending", eventStatus: "scheduled" })
  })

  it.each([
    "paused",
    "archived",
  ])("normalizes legacy %s approval to approved", approvalStatus => {
    expect(
      buildArrangementStatusPatch({
        _id: approvalStatus,
        _type: "arrangement",
        approvalStatus,
        eventStatus: "scheduled",
      }),
    ).toEqual({ approvalStatus: "approved" })
  })

  it("normalizes postponed to scheduled", () => {
    expect(
      buildArrangementStatusPatch({
        _id: "postponed",
        _type: "arrangement",
        approvalStatus: "approved",
        eventStatus: "postponed",
      }),
    ).toEqual({ eventStatus: "scheduled" })
  })

  it.each([
    ["pending", "scheduled"],
    ["rejected", "scheduled"],
    ["approved", "scheduled"],
    ["approved", "cancelled"],
  ])("preserves normalized %s/%s", (approvalStatus, eventStatus) => {
    expect(
      buildArrangementStatusPatch({
        _id: `${approvalStatus}-${eventStatus}`,
        _type: "arrangement",
        approvalStatus,
        eventStatus,
      }),
    ).toEqual({})
  })

  it("is idempotent after applying its patch", () => {
    const document = { _id: "legacy", _type: "arrangement" }
    const patch = buildArrangementStatusPatch(document)
    expect(buildArrangementStatusPatch({ ...document, ...patch })).toEqual({})
  })

  it("ignores other document types", () => {
    expect(buildArrangementStatusPatch({ _id: "page", _type: "page" })).toEqual(
      {},
    )
  })
})
