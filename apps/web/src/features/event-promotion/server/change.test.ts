import { describe, expect, it } from "vitest"
import {
  type PromotionChange,
  promotionChangeId,
  promotionChangeKind,
  promotionChangeSchema,
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
  it("distinguishes starts, placement changes and ends for PostHog's timeline", () => {
    expect(promotionChangeKind(change)).toBe("started")
    expect(
      promotionChangeKind({
        ...change,
        before: change.after,
        after: { ...change.after, order: 0 },
      }),
    ).toBe("placement_changed")
    expect(
      promotionChangeKind({
        ...change,
        before: change.after,
        after: change.before,
      }),
    ).toBe("ended")
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
