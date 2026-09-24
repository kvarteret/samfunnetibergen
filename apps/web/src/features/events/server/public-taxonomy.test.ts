import { beforeEach, describe, expect, it, vi } from "vitest"

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }))
vi.mock("@/lib/sanity/client", () => ({ sanityClient: { fetch: fetchMock } }))

import { fetchPublicEventTaxonomy } from "./public-taxonomy"

describe("fetchPublicEventTaxonomy", () => {
  beforeEach(() => fetchMock.mockReset())

  it("groups dynamic event types by Sanity taxonomy group and returns all rooms", async () => {
    fetchMock
      .mockResolvedValueOnce([
        { _id: "group-music", name: "Konserter" },
        { _id: "group-social", name: "Sosialt" },
      ])
      .mockResolvedValueOnce([
        {
          _id: "type-concert",
          name: "Konsert",
          taxonomyGroup: { _id: "group-music", name: "Konserter" },
        },
        {
          _id: "type-pub",
          name: "Pub",
          taxonomyGroup: { _id: "group-social", name: "Sosialt" },
        },
      ])
      .mockResolvedValueOnce([
        { _id: "room-teglverket", title: "Teglverket", slug: "teglverket" },
      ])

    await expect(fetchPublicEventTaxonomy("nb")).resolves.toEqual({
      eventTypeGroups: [
        {
          id: "group-music",
          name: "Konserter",
          eventTypes: [{ id: "type-concert", name: "Konsert" }],
        },
        {
          id: "group-social",
          name: "Sosialt",
          eventTypes: [{ id: "type-pub", name: "Pub" }],
        },
      ],
      rooms: [
        { id: "room-teglverket", name: "Teglverket", slug: "teglverket" },
      ],
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      { locale: "nb" },
      expect.objectContaining({ perspective: "published", stega: false }),
    )
  })
})
