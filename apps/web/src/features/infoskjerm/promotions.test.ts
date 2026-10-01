import { afterEach, beforeEach, expect, it, vi } from "vitest"
import {
  type RawPublicEvent,
  resolvePublicEvent,
} from "@/features/events/domain/events"
import { selectScreenPromotions } from "./promotions"

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-10-01T12:00:00Z"))
})
afterEach(() => vi.useRealTimers())

function promotion(id: string, extra: Partial<RawPublicEvent> = {}) {
  return resolvePublicEvent({
    _id: id,
    title: id,
    isPromoted: true,
    dates: [{ _key: "future", startDate: "2026-10-03", startTime: "20:00" }],
    ...extra,
  })
}

it("replaces same-day top promotions with eligible pool events before taking two", () => {
  const result = selectScreenPromotions(
    [
      promotion("today", {
        promotedPlacement: "top",
        dates: [
          { _key: "today", startDate: "2026-10-01" },
          { _key: "future", startDate: "2026-10-03" },
        ],
      }),
      promotion("top", { promotedPlacement: "top", promotedOrder: 2 }),
      promotion("pool-2", { promotedPlacement: "pool", promotedOrder: 4 }),
      promotion("pool-1", { promotedPlacement: "pool", promotedOrder: 3 }),
    ],
    "2026-10-01",
    new Set(["today"]),
  )
  expect(result.map(event => event.id)).toEqual(["top", "pool-1"])
})

it("excludes a parent with a session today, duplicates, cancellations and past events", () => {
  const eligible = promotion("eligible")
  const result = selectScreenPromotions(
    [
      promotion("parent", { eventKind: "seriesParent" }),
      promotion("cancelled", { eventStatus: "cancelled" }),
      promotion("child", { eventKind: "seriesInstance" }),
      promotion("past", { dates: [{ _key: "past", startDate: "2026-09-30" }] }),
      eligible,
      eligible,
    ],
    "2026-10-01",
    new Set(["parent"]),
  )
  expect(result.map(event => event.id)).toEqual(["eligible"])
})

it("shows the earliest future date and does not invent promotions when the pool is empty", () => {
  const result = selectScreenPromotions(
    [
      promotion("dates", {
        dates: [
          { _key: "later", startDate: "2026-10-05" },
          { _key: "first", startDate: "2026-10-02", startTime: "19:00" },
        ],
      }),
    ],
    "2026-10-01",
    new Set(),
  )
  expect(result[0]).toEqual(
    expect.objectContaining({
      date: "2026-10-02",
      startTime: "19:00",
      dateLabel: "I morgen, 19:00",
    }),
  )
  expect(selectScreenPromotions([], "2026-10-01", new Set())).toEqual([])
})
