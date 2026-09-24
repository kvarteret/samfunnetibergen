import { beforeEach, describe, expect, it, vi } from "vitest"

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }))
vi.mock("@/lib/sanity/client", () => ({ sanityClient: { fetch: fetchMock } }))

import { fetchPublicEventTaxonomy } from "./public-taxonomy"

describe("fetchPublicEventTaxonomy", () => {
  beforeEach(() => fetchMock.mockReset())

  it("returns all published groups, types, and rooms for feed ID mapping", async () => {
    fetchMock
      .mockResolvedValueOnce([
        { _id: "group-music", name: "Konserter" },
        { _id: "group-social", name: "Sosialt" },
        { _id: "group-empty", name: "Annet" },
      ])
      .mockResolvedValueOnce([
        {
          _id: "type-concert",
          name: "Konsert",
          taxonomyGroupId: "group-music",
          isActive: true,
        },
        {
          _id: "type-pub",
          name: "Pub",
          taxonomyGroupId: "group-social",
          isActive: false,
        },
        {
          _id: "type-legacy",
          name: "Legacy",
          taxonomyGroupId: null,
          isActive: false,
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
        { id: "group-empty", name: "Annet", eventTypes: [] },
      ],
      eventTypes: [
        {
          id: "type-concert",
          name: "Konsert",
          taxonomyGroupId: "group-music",
          isActive: true,
        },
        {
          id: "type-pub",
          name: "Pub",
          taxonomyGroupId: "group-social",
          isActive: false,
        },
        {
          id: "type-legacy",
          name: "Legacy",
          taxonomyGroupId: null,
          isActive: false,
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
