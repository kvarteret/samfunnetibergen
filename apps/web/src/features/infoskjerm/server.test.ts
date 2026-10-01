import { expect, it, vi } from "vitest"
import {
  flattenPublicOccurrences,
  resolvePublicEvent,
} from "@/features/events/domain/events"
import {
  fetchPublicEventSet,
  fetchPublicPromotedParentEvents,
} from "@/features/events/server/public-events"
import { fetchScreenEvents } from "./server"

vi.mock("@/features/events/server/public-events", () => ({
  fetchPublicEventSet: vi.fn(),
  fetchPublicPromotedParentEvents: vi.fn().mockResolvedValue([]),
}))

it("requests only today's Norwegian public occurrences and preserves cancellation and room fallbacks", async () => {
  const event = resolvePublicEvent({
    _id: "event",
    title: "Dagens debatt",
    eventStatus: "cancelled",
    roomText: "Teglverket",
    organizerText: "Studentersamfunnet",
    dates: [{ _key: "today", startDate: "2026-10-01", startTime: "19:00:00" }],
  })
  vi.mocked(fetchPublicEventSet).mockResolvedValue({
    events: [event],
    occurrences: flattenPublicOccurrences([event]),
  })

  const result = await fetchScreenEvents(new Date("2026-09-30T22:30:00Z"))

  expect(fetchPublicEventSet).toHaveBeenCalledWith({
    locale: "nb",
    from: "2026-10-01",
    to: null,
  })
  expect(result.date).toBe("2026-10-01")
  expect(result.events).toEqual([
    expect.objectContaining({
      title: "Dagens debatt",
      startTime: "19:00",
      room: "Teglverket",
      floor: null,
      organizer: "Studentersamfunnet",
      cancelled: true,
    }),
  ])
})

it("keeps the daily schedule separate from future promotions and fills exclusions from the pool", async () => {
  const today = resolvePublicEvent({
    _id: "today",
    title: "Today",
    isPromoted: true,
    dates: [{ _key: "today", startDate: "2026-10-01" }],
  })
  const future = resolvePublicEvent({
    _id: "future",
    title: "Future",
    isPromoted: true,
    dates: [{ _key: "future", startDate: "2026-10-02" }],
  })
  const parent = resolvePublicEvent({
    _id: "series",
    title: "Series",
    eventKind: "seriesParent",
    isPromoted: true,
    dates: [{ _key: "future", startDate: "2026-10-03" }],
  })
  vi.mocked(fetchPublicEventSet).mockResolvedValue({
    events: [today, future],
    occurrences: flattenPublicOccurrences([today, future]),
  })
  vi.mocked(fetchPublicPromotedParentEvents).mockResolvedValueOnce([parent])
  const result = await fetchScreenEvents(new Date("2026-10-01T12:00:00Z"))
  expect(result.events.map(event => event.title)).toEqual(["Today"])
  expect(result.promotions.map(event => event.title)).toEqual([
    "Future",
    "Series",
  ])
})

it("passes the room's floor through, including ground-floor zero", async () => {
  const event = resolvePublicEvent({
    _id: "ground-floor-event",
    title: "Dagens konsert",
    room: {
      _id: "room",
      title: "Rom",
      slug: "rom",
      floor: 0,
      imageUrl: null,
    },
    dates: [{ _key: "today", startDate: "2026-10-01" }],
  })
  vi.mocked(fetchPublicEventSet).mockResolvedValue({
    events: [event],
    occurrences: flattenPublicOccurrences([event]),
  })
  const result = await fetchScreenEvents(new Date("2026-10-01T12:00:00Z"))
  expect(result.events[0].floor).toBe(0)
})
