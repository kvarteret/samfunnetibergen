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

function dateAt(offset: number): string {
  const date = new Date(Date.UTC(2026, 8, 1 + offset))
  return date.toISOString().slice(0, 10)
}

function makeOccurrences(count: number) {
  const events = Array.from({ length: count }, (_, index) =>
    resolvePublicEvent({
      _id: `event-${String(index).padStart(3, "0")}`,
      _updatedAt: "2026-09-01T10:00:00.000Z",
      eventKind: "single",
      eventStatus: "scheduled",
      slug: `event-${index}`,
      title: `Event ${index}`,
      isFree: false,
      priceOrdinar: 150,
      priceStudent: 100,
      priceMedlem: 75,
      ticketUrl: `https://tickets.example.test/event-${index}`,
      dates: [
        {
          _key: `date-${index}`,
          startDate: dateAt(index),
          startTime: "18:00",
          endTime: "20:00",
        },
      ],
    }),
  )
  return { events, occurrences: flattenPublicOccurrences(events) }
}

describe("GET /api/v1/events", () => {
  beforeEach(() => {
    process.env.SITE_URL = "https://api.example.test"
    fetchPublicEventSetMock.mockReset()
  })

  it("returns the default Norwegian today-forward collection", async () => {
    const result = makeOccurrences(1)
    fetchPublicEventSetMock.mockResolvedValue(result)

    const response = await GET(
      new Request("https://request-host.example/api/v1/events"),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe(
      "application/json; charset=utf-8",
    )
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=60, stale-while-revalidate=300",
    )
    expect(body.meta).toMatchObject({
      locale: "nb",
      paginated: false,
      count: 1,
      total: 1,
    })
    expect(body.links).toEqual({
      self: "https://api.example.test/api/v1/events?locale=nb",
      next: null,
    })
    expect(body.data[0].event).toMatchObject({
      updatedAt: "2026-09-01T10:00:00.000Z",
      location: {
        kind: "venue",
        name: "Det Akademiske Kvarter",
      },
      pricing: {
        currency: "NOK",
        isFree: false,
        ordinary: 150,
        student: 100,
        member: 75,
      },
      links: {
        ticket: "https://tickets.example.test/event-0",
      },
    })
    expect(fetchPublicEventSetMock).toHaveBeenCalledWith({
      locale: "nb",
      from: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      to: null,
      includeInternal: false,
    })
  })

  it("paginates explicit ranges at 100 and traverses opaque next links", async () => {
    const result = makeOccurrences(205)
    fetchPublicEventSetMock.mockResolvedValue(result)
    const firstRequest = new Request(
      "https://request-host.example/api/v1/events?locale=en&from=2026-09-01&to=2027-04-01",
    )

    const firstResponse = await GET(firstRequest)
    const firstBody = await firstResponse.json()
    const secondResponse = await GET(new Request(firstBody.links.next))
    const secondBody = await secondResponse.json()
    const thirdResponse = await GET(new Request(secondBody.links.next))
    const thirdBody = await thirdResponse.json()

    expect(firstBody.meta).toMatchObject({
      locale: "en",
      from: "2026-09-01",
      to: "2027-04-01",
      count: 100,
      total: 205,
      paginated: true,
    })
    expect(secondBody.meta.count).toBe(100)
    expect(thirdBody.meta).toMatchObject({ count: 5, total: 205 })
    expect(thirdBody.links.next).toBeNull()
    expect(
      [firstBody, secondBody, thirdBody].flatMap(body =>
        body.data.map((item: { id: string }) => item.id),
      ),
    ).toHaveLength(205)
    expect(
      new Set(
        [firstBody, secondBody, thirdBody].flatMap(body =>
          body.data.map((item: { id: string }) => item.id),
        ),
      ),
    ).toHaveProperty("size", 205)
  })

  it("rejects invalid requests before reading Sanity", async () => {
    const response = await GET(
      new Request(
        "https://request-host.example/api/v1/events?locale=de&from=2026-09-01",
      ),
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    expect(body.error.code).toBe("invalid_request")
    expect(fetchPublicEventSetMock).not.toHaveBeenCalled()
  })

  it("rejects a cursor on the unpaginated default request", async () => {
    const response = await GET(
      new Request(
        "https://request-host.example/api/v1/events?cursor=not-a-cursor",
      ),
    )

    expect(response.status).toBe(400)
    expect(fetchPublicEventSetMock).not.toHaveBeenCalled()
  })
})

describe("/api/v1/events protocol helpers", () => {
  it("answers OPTIONS without accessing Sanity", async () => {
    const response = OPTIONS()

    expect(response.status).toBe(204)
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET, HEAD, OPTIONS",
    )
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
      "Accept, Content-Type, Origin",
    )
  })

  it("returns an empty HEAD response with the GET status and headers", async () => {
    fetchPublicEventSetMock.mockResolvedValue(makeOccurrences(0))

    const response = await HEAD(
      new Request("https://request-host.example/api/v1/events"),
    )

    expect(response.status).toBe(200)
    expect(response.body).toBeNull()
    expect(response.headers.get("Content-Type")).toBe(
      "application/json; charset=utf-8",
    )
  })
})
