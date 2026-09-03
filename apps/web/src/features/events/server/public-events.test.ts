import { beforeEach, describe, expect, it, vi } from "vitest"

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }))

vi.mock("@/lib/sanity/client", () => ({
  sanityClient: { fetch: fetchMock },
}))

import {
  fetchPublicEventBySlug,
  fetchPublicEventChildren,
  fetchPublicEventSet,
  fetchPublicPromotedParentEvents,
} from "./public-events"

const eventRow = {
  _id: "event-1",
  _updatedAt: "2026-09-01T10:00:00.000Z",
  eventKind: "single" as const,
  eventStatus: "scheduled" as const,
  parent: null,
  slug: "event-1",
  dates: [
    {
      _key: "date-1",
      startDate: "2026-09-10",
      startTime: "18:00",
      endTime: "20:00",
    },
  ],
  room: null,
  roomText: null,
  title: "Event",
  description: [],
  imageUrl: null,
  imageCaption: null,
  organizerGroup: null,
  organizerText: null,
  eventType: null,
  isFree: false,
  priceOrdinar: null,
  priceStudent: null,
  priceMedlem: null,
  ticketUrl: null,
  facebookUrl: null,
  isInternalEvent: false,
  useFestivalImage: true,
}

describe("public event service", () => {
  beforeEach(() => fetchMock.mockReset())

  it("fetches published range rows and returns globally flattened occurrences", async () => {
    fetchMock.mockResolvedValue([eventRow])

    const result = await fetchPublicEventSet({
      locale: "en",
      from: "2026-09-01",
      to: "2026-09-30",
    })

    expect(result.occurrences).toHaveLength(1)
    expect(result.events[0]?.title).toBe("Event")
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("$from"),
      {
        locale: "en",
        from: "2026-09-01",
        to: "2026-09-30",
        includeInternal: false,
      },
      expect.objectContaining({
        perspective: "published",
        stega: false,
        next: { revalidate: 60 },
      }),
    )
  })

  it("fetches a parent program through the same public projection", async () => {
    const parent = {
      ...eventRow,
      _id: "parent-1",
      eventKind: "seriesParent" as const,
      slug: "series",
      title: "Series",
      dates: [],
    }
    const child = {
      ...eventRow,
      _id: "child-1",
      eventKind: "seriesInstance" as const,
      slug: "series-day",
      parent: {
        _id: "parent-1",
        _updatedAt: "2026-09-01T10:00:00.000Z",
        eventKind: "seriesParent",
        eventStatus: "scheduled",
        slug: "series",
        title: "Series",
        description: [],
        imageUrl: null,
        imageCaption: null,
        organizerGroup: null,
        organizerText: null,
        eventType: null,
        isFree: false,
        priceOrdinar: null,
        priceStudent: null,
        priceMedlem: null,
        ticketUrl: null,
        facebookUrl: null,
        isInternalEvent: false,
      },
    }
    fetchMock.mockResolvedValueOnce(parent).mockResolvedValueOnce([child])

    const result = await fetchPublicEventBySlug("series", "nb", true)

    expect(result?.event.eventKind).toBe("seriesParent")
    expect(result?.children).toHaveLength(1)
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("$parentId"),
      expect.objectContaining({
        parentId: "parent-1",
        includeInternal: true,
      }),
      expect.anything(),
    )
  })

  it("fetches promoted parents through the published public service", async () => {
    fetchMock.mockResolvedValue([eventRow])

    const result = await fetchPublicPromotedParentEvents({
      locale: "nb",
      from: "2026-09-01",
      to: null,
    })

    expect(result).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("isPromoted == true"),
      expect.objectContaining({
        locale: "nb",
        from: "2026-09-01",
        to: null,
      }),
      expect.anything(),
    )
  })

  it("exposes children as resolved public events for calendar and detail pages", async () => {
    fetchMock.mockResolvedValue([eventRow])

    const result = await fetchPublicEventChildren("parent-1", "en")

    expect(result[0]?.title).toBe("Event")
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("$parentId"),
      expect.objectContaining({
        parentId: "parent-1",
        locale: "en",
        from: null,
        to: null,
      }),
      expect.anything(),
    )
  })
})
