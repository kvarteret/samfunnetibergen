import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  flattenPublicOccurrences,
  resolvePublicEvent,
} from "@/features/events/domain/public-events"

const { fetchPublicEventSetMock } = vi.hoisted(() => ({
  fetchPublicEventSetMock: vi.fn(),
}))

vi.mock("@/features/events/server/public-events", () => ({
  fetchPublicEventSet: fetchPublicEventSetMock,
}))

import { GET, HEAD, OPTIONS } from "./route"

function makeOccurrences() {
  const event = resolvePublicEvent({
    _id: "feed-event",
    _updatedAt: "2026-09-01T10:00:00.000Z",
    eventKind: "single",
    eventStatus: "scheduled",
    slug: "feed-event",
    title: "Feed event",
    room: null,
    roomText: null,
    dates: [
      {
        _key: "date-1",
        startDate: "2026-09-02",
        startTime: "21:00",
        endTime: "02:30",
      },
      {
        _key: "date-2",
        startDate: "2026-09-03",
        startTime: "19:00",
        endTime: null,
      },
    ],
  })
  return { events: [event], occurrences: flattenPublicOccurrences([event]) }
}

describe("GET /api/events/feed", () => {
  beforeEach(() => {
    process.env.SITE_URL = "https://api.example.test"
    fetchPublicEventSetMock.mockReset()
    fetchPublicEventSetMock.mockResolvedValue(makeOccurrences())
  })

  it("returns one DataFeedItem per occurrence, including missing locations", async () => {
    const response = await GET()
    const body = JSON.parse(await response.text())

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe(
      "application/ld+json; charset=utf-8",
    )
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=60, stale-while-revalidate=300",
    )
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    expect(body).toMatchObject({
      "@context": "https://schema.org",
      "@type": "DataFeed",
      "@id": "https://api.example.test/api/events/feed",
      url: "https://api.example.test/api/events/feed",
    })
    expect(body).not.toHaveProperty("itemListElement")
    expect(body.dataFeedElement).toHaveLength(2)
    expect(
      body.dataFeedElement.every(
        (item: { "@type": string }) => item["@type"] === "DataFeedItem",
      ),
    ).toBe(true)
    expect(body.dataFeedElement[0].item).not.toHaveProperty("location")
    expect(body.dataFeedElement[0].item.startDate).toBe(
      "2026-09-02T19:00:00.000Z",
    )
    expect(body.dataFeedElement[0].item.endDate).toBe(
      "2026-09-03T00:30:00.000Z",
    )
    expect(body.dataFeedElement[0]["@id"]).not.toBe(
      body.dataFeedElement[0].item["@id"],
    )
  })

  it("answers HEAD and OPTIONS without changing the public protocol", async () => {
    const head = await HEAD()
    expect(head.status).toBe(200)
    expect(head.body).toBeNull()
    expect(head.headers.get("Content-Type")).toBe(
      "application/ld+json; charset=utf-8",
    )

    const options = OPTIONS()
    expect(options.status).toBe(204)
    expect(options.headers.get("Access-Control-Allow-Origin")).toBe("*")
    expect(options.headers.get("Access-Control-Allow-Headers")).toBe(
      "Accept, Content-Type, Origin",
    )
  })
})
