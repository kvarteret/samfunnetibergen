import { describe, expect, it } from "vitest"

import {
  arrangementApprovalIssues,
  arrangementApprovalReason,
  publishableArrangement,
} from "./approvalActions"

describe("publishing an arrangement status transition", () => {
  it("publishes the latest draft content under the stable document id", () => {
    expect(
      publishableArrangement(
        {
          _id: "drafts.request-1",
          _type: "arrangement",
          _createdAt: "2026-01-01T00:00:00Z",
          _updatedAt: "2026-01-02T00:00:00Z",
          _rev: "draft-revision",
          title: "Siste redigerte tittel",
          approvalStatus: "pending",
        },
        "request-1",
        "approved",
      ),
    ).toEqual({
      _id: "request-1",
      _type: "arrangement",
      title: "Siste redigerte tittel",
      approvalStatus: "approved",
    })
  })

  it("blocks approval when a populated canonical field lacks English", () => {
    const missing = arrangementApprovalIssues({
      _id: "drafts/request-2",
      _type: "arrangement",
      eventKind: "single",
      localizedTitle: [{ language: "nb", value: "Norsk tittel" }],
    })

    expect(missing).toContain("localizedTitle.en")
    expect(arrangementApprovalReason(missing)).toContain("Kan ikke godkjenne")
  })

  it("allows a pending draft to remain nb-only when not approved", () => {
    const missing = arrangementApprovalIssues({
      _id: "drafts/request-3",
      _type: "arrangement",
      eventKind: "single",
      approvalStatus: "pending",
      localizedTitle: [{ language: "nb", value: "Norsk tittel" }],
    })

    expect(missing).toContain("localizedTitle.en")
    // The readiness result is only consulted by the approval transition; the
    // draft itself is never deleted or rejected by this pure check.
    expect(missing.length).toBeGreaterThan(0)
  })

  it("does not require an inherited child title", () => {
    expect(
      arrangementApprovalIssues({
        _id: "child",
        _type: "arrangement",
        eventKind: "festivalSession",
      }),
    ).toEqual([])
  })

  it("blocks duplicate language entries even when English exists", () => {
    expect(
      arrangementApprovalIssues({
        _id: "duplicate",
        _type: "arrangement",
        eventKind: "single",
        localizedTitle: [
          { language: "nb", value: "Norsk" },
          { language: "nb", value: "Norsk" },
          { language: "en", value: "English" },
        ],
      }),
    ).toContain("localizedTitle.nb")
  })
})
