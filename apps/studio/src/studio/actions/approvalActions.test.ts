import { describe, expect, it } from "vitest"

import { publishableArrangement } from "./approvalActions"

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
})
