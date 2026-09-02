import { beforeEach, describe, expect, it, vi } from "vitest"

const { draftModeMock, fetchMock, sanityFetchMock } = vi.hoisted(() => ({
  draftModeMock: vi.fn(),
  fetchMock: vi.fn(),
  sanityFetchMock: vi.fn(),
}))

vi.mock("next/headers", () => ({ draftMode: draftModeMock }))
vi.mock("@/lib/sanity/client", () => ({
  sanityClient: { fetch: fetchMock },
}))
vi.mock("@/lib/sanity/fetcher", () => ({ sanityFetch: sanityFetchMock }))

import { fetchEventPageData } from "./public-events"

const eventRow = {
  _id: "event-1",
  eventKind: "single" as const,
  eventStatus: "scheduled" as const,
  parent: null,
  slug: "event-1",
  title: "Event",
  dates: [],
}

describe("event page controller", () => {
  beforeEach(() => {
    draftModeMock.mockReset()
    fetchMock.mockReset()
    sanityFetchMock.mockReset()
  })

  it("uses the published service outside preview mode", async () => {
    draftModeMock.mockResolvedValue({ isEnabled: false })
    fetchMock.mockResolvedValue(eventRow)

    const result = await fetchEventPageData("event-1", "nb")

    expect(result?.event.title).toBe("Event")
    expect(result?.children).toEqual([])
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(sanityFetchMock).not.toHaveBeenCalled()
  })

  it("fetches a preview parent and its children through one projection", async () => {
    draftModeMock.mockResolvedValue({ isEnabled: true })
    sanityFetchMock
      .mockResolvedValueOnce({
        data: {
          ...eventRow,
          _id: "parent-1",
          eventKind: "seriesParent",
          slug: "series",
          title: "Series",
        },
      })
      .mockResolvedValueOnce({
        data: [
          {
            ...eventRow,
            _id: "child-1",
            eventKind: "seriesInstance",
            slug: "series-day",
          },
        ],
      })

    const result = await fetchEventPageData("series", "en", { stega: false })

    expect(result?.event.eventKind).toBe("seriesParent")
    expect(result?.children.map(child => child._id)).toEqual(["child-1"])
    expect(sanityFetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
