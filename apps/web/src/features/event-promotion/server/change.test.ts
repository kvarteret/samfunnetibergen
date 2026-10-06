import { describe, expect, it } from "vitest"
import {
  type PromotionChange,
  promotionChangeId,
  promotionChangeSchema,
  promotionHistoryDocument,
} from "./change"

const change: PromotionChange = {
  eventId: "snooks",
  revision: "rev1",
  changedAt: "2026-10-06T16:56:52Z",
  slug: "the-snooks",
  title: "The Snooks",
  before: { promoted: false, placement: null, order: null },
  after: { promoted: true, placement: "pool", order: 3 },
}

describe("promotion campaign history", () => {
  it("assigns one stable start ID across retries and a new ID on re-promotion", () => {
    expect(promotionChangeId(change)).toBe(promotionChangeId({ ...change }))
    expect(promotionChangeId({ ...change, revision: "rev2" })).not.toBe(
      promotionChangeId(change),
    )
  })
  it("keeps reorder and end changes in the original campaign", () => {
    const id = promotionChangeId(change)
    const reordered = promotionHistoryDocument(
      {
        ...change,
        before: change.after,
        after: { ...change.after, placement: "top", order: 0 },
      },
      id,
      change.changedAt,
    )
    expect(reordered).toMatchObject({
      campaignId: id,
      kind: "placement_changed",
      beforeOrder: 3,
      afterOrder: 0,
    })
    const ended = promotionHistoryDocument(
      { ...change, before: change.after, after: change.before },
      id,
      change.changedAt,
    )
    expect(ended).toMatchObject({
      campaignId: id,
      kind: "ended",
      afterPromoted: false,
    })
  })
  it("rejects drafts, invalid timestamps and malformed promotion state", () => {
    expect(promotionChangeSchema.safeParse(change).success).toBe(true)
    expect(
      promotionChangeSchema.safeParse({ ...change, eventId: "drafts.snooks" })
        .success,
    ).toBe(false)
    expect(
      promotionChangeSchema.safeParse({ ...change, changedAt: "today" })
        .success,
    ).toBe(false)
    expect(
      promotionChangeSchema.safeParse({
        ...change,
        after: { ...change.after, promoted: "true" },
      }).success,
    ).toBe(false)
  })
})
