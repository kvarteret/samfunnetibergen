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
      count: 1,
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
      description: { html: "", text: "" },
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

  it("returns every occurrence for an explicit inclusive range", async () => {
    const result = makeOccurrences(205)
    fetchPublicEventSetMock.mockResolvedValue(result)
    const response = await GET(
      new Request(
        "https://request-host.example/api/v1/events?locale=en&from=2026-09-01&to=2027-04-01",
      ),
    )
    const body = await response.json()

    expect(body.meta).toMatchObject({
      locale: "en",
      from: "2026-09-01",
      to: "2027-04-01",
      count: 205,
    })
    expect(body.data).toHaveLength(205)
  })

  it("serializes an occurrence without a time as a date-only schedule", async () => {
    const event = resolvePublicEvent({
      _id: "date-only",
      eventKind: "single",
      eventStatus: "scheduled",
      slug: "date-only",
      title: "Date-only event",
      dates: [
        {
          _key: "date-only-occurrence",
          startDate: "2026-10-14",
          startTime: null,
          endTime: null,
        },
      ],
    })
    fetchPublicEventSetMock.mockResolvedValue({
      events: [event],
      occurrences: flattenPublicOccurrences([event]),
    })

    const response = await GET(
      new Request(
        "https://request-host.example/api/v1/events?from=2026-10-14&to=2026-10-14",
      ),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data[0].schedule).toEqual({
      kind: "date",
      date: "2026-10-14",
      timeZone: "Europe/Oslo",
    })
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

  it("rejects unsupported query parameters without reading Sanity", async () => {
    const response = await GET(
      new Request("https://request-host.example/api/v1/events?limit=100"),
    )

    expect(response.status).toBe(400)
    expect(fetchPublicEventSetMock).not.toHaveBeenCalled()
  })

  it("returns 304 for an unchanged conditional snapshot", async () => {
    fetchPublicEventSetMock.mockResolvedValue(makeOccurrences(1))
    const first = await GET(
      new Request("https://request-host.example/api/v1/events"),
    )
    const etag = first.headers.get("ETag")
    expect(etag).toBeTruthy()

    const second = await GET(
      new Request("https://request-host.example/api/v1/events", {
        headers: { "If-None-Match": etag! },
      }),
    )
    expect(second.status).toBe(304)
    expect(second.body).toBeNull()
    expect(second.headers.get("ETag")).toBe(etag)
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
      "Accept, Content-Type, If-None-Match, Origin",
    )
    expect(response.headers.get("Access-Control-Expose-Headers")).toBe("ETag")
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
