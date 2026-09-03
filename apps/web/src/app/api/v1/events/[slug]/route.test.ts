import { beforeEach, describe, expect, it, vi } from "vitest"

import { resolvePublicEvent } from "@/features/events/domain/public-events"

const { fetchPublicEventBySlugMock } = vi.hoisted(() => ({
  fetchPublicEventBySlugMock: vi.fn(),
}))

vi.mock("@/features/events/server/public-events", () => ({
  fetchPublicEventBySlug: fetchPublicEventBySlugMock,
}))

import { GET, HEAD, OPTIONS } from "./route"

function makeEvent() {
  return resolvePublicEvent({
    _id: "historical-event",
    _updatedAt: "2026-01-01T10:00:00.000Z",
    eventKind: "single",
    eventStatus: "scheduled",
    slug: "historical-event",
    title: "Historical event",
    description: [
      {
        _key: "block-1",
        _type: "block",
        children: [{ _key: "span-1", _type: "span", text: "A description" }],
        markDefs: [],
      },
    ],
    room: {
      _id: "room-1",
      title: "Teglverket",
      slug: "teglverket",
      floor: 1,
      imageUrl: "https://cdn.example.test/room.jpg",
    },
    imageUrl: "https://cdn.example.test/event.jpg",
    imageCaption: "Event image",
    eventType: {
      _id: "concert",
      name: "Concert",
      taxonomyGroup: { _id: "music", name: "Music" },
    },
    organizerText: "Samfunnet",
    isFree: false,
    priceOrdinar: 120,
    priceStudent: 80,
    priceMedlem: 60,
    ticketUrl: "https://tickets.example.test/event",
    facebookUrl: "https://facebook.example.test/event",
    dates: [
      {
        _key: "date-1",
        startDate: "2026-01-10",
        startTime: "21:00",
        endTime: "02:30",
      },
    ],
  })
}

describe("GET /api/v1/events/[slug]", () => {
  beforeEach(() => {
    process.env.SITE_URL = "https://api.example.test"
    fetchPublicEventBySlugMock.mockReset()
  })

  it("returns historical detail with rich content, prices, and normalized occurrences", async () => {
    const event = makeEvent()
    fetchPublicEventBySlugMock.mockResolvedValue({ event, children: [] })

    const response = await GET(
      new Request(
        "https://request-host.example/api/v1/events/historical-event?locale=en",
      ),
      { params: Promise.resolve({ slug: "historical-event" }) },
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.meta).toEqual({ locale: "en" })
    expect(body.data.detailKind).toBe("leaf")
    expect(body.data.description.text).toBe("A description")
    expect(body.data.description.html).toBe("<p>A description</p>")
    expect(body.data.pricing).toEqual({
      currency: "NOK",
      isFree: false,
      ordinary: 120,
      student: 80,
      member: 60,
    })
    expect(body.data.occurrences[0].schedule).toMatchObject({
      kind: "timed",
      startsAt: "2026-01-10T20:00:00.000Z",
      endsAt: "2026-01-11T01:30:00.000Z",
      timeZone: "Europe/Oslo",
    })
    expect(body.data.links.website).toBe(
      "https://api.example.test/en/arrangementer/historical-event",
    )
    expect(body).not.toHaveProperty("links")
    expect(body.data.occurrences[0]).not.toHaveProperty("event")
    expect(fetchPublicEventBySlugMock).toHaveBeenCalledWith(
      "historical-event",
      "en",
      false,
    )
  })

  it("returns not_found without exposing Sanity details", async () => {
    fetchPublicEventBySlugMock.mockResolvedValue(null)

    const response = await GET(
      new Request("https://request-host.example/api/v1/events/missing"),
      { params: Promise.resolve({ slug: "missing" }) },
    )
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toEqual({
      error: {
        code: "not_found",
        message: "The requested public event was not found.",
      },
    })
  })

  it("returns parent programs as child summaries without repeating the parent", async () => {
    const parent = resolvePublicEvent({
      _id: "series-parent",
      eventKind: "seriesParent",
      eventStatus: "scheduled",
      slug: "series-parent",
      title: "Series parent",
      description: [
        {
          _type: "block",
          style: "normal",
          children: [{ _type: "span", text: "Parent description" }],
          markDefs: [],
        },
      ],
      dates: [],
    })
    const child = resolvePublicEvent({
      _id: "series-child",
      eventKind: "seriesInstance",
      eventStatus: "scheduled",
      slug: "series-child",
      title: "Child event",
      parent: {
        _id: parent._id,
        eventKind: parent.eventKind,
        eventStatus: parent.eventStatus,
        slug: parent.slug,
        title: parent.title,
      },
      dates: [
        {
          _key: "child-date",
          startDate: "2026-01-11",
          startTime: "19:00",
          endTime: "20:00",
        },
      ],
    })
    fetchPublicEventBySlugMock.mockResolvedValue({
      event: parent,
      children: [child],
    })

    const response = await GET(
      new Request("https://request-host.example/api/v1/events/series-parent"),
      { params: Promise.resolve({ slug: "series-parent" }) },
    )
    const body = await response.json()
    const childSummary = body.data.occurrences[0].event

    expect(body.data.detailKind).toBe("parent")
    expect(childSummary).toMatchObject({
      id: "series-child",
      title: "Child event",
      description: { html: "", text: "" },
    })
    expect(childSummary).not.toHaveProperty("parent")
    expect(body.data).not.toHaveProperty("occurrences[0].event.parent")
  })

  it("passes the hidden internal opt-in to the server-side lookup", async () => {
    fetchPublicEventBySlugMock.mockResolvedValue({
      event: makeEvent(),
      children: [],
    })

    const response = await GET(
      new Request(
        "https://request-host.example/api/v1/events/internal?includeInternal=true",
      ),
      { params: Promise.resolve({ slug: "internal" }) },
    )

    expect(response.status).toBe(200)
    expect(fetchPublicEventBySlugMock).toHaveBeenCalledWith(
      "internal",
      "nb",
      true,
    )
  })

  it("answers protocol preflight and HEAD requests", async () => {
    expect(OPTIONS().status).toBe(204)

    fetchPublicEventBySlugMock.mockResolvedValue({
      event: makeEvent(),
      children: [],
    })
    const response = await HEAD(
      new Request(
        "https://request-host.example/api/v1/events/historical-event",
      ),
      { params: Promise.resolve({ slug: "historical-event" }) },
    )

    expect(response.status).toBe(200)
    expect(response.body).toBeNull()
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
  })

  it("returns 304 for an unchanged conditional detail", async () => {
    fetchPublicEventBySlugMock.mockResolvedValue({
      event: makeEvent(),
      children: [],
    })
    const first = await GET(
      new Request(
        "https://request-host.example/api/v1/events/historical-event",
      ),
      { params: Promise.resolve({ slug: "historical-event" }) },
    )
    const etag = first.headers.get("ETag")
    expect(etag).toBeTruthy()

    const second = await GET(
      new Request(
        "https://request-host.example/api/v1/events/historical-event",
        { headers: { "If-None-Match": etag! } },
      ),
      { params: Promise.resolve({ slug: "historical-event" }) },
    )
    expect(second.status).toBe(304)
    expect(second.body).toBeNull()
    expect(second.headers.get("ETag")).toBe(etag)
  })
})
