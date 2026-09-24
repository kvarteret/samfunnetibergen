import { beforeEach, describe, expect, it, vi } from "vitest"

const { fetchPublicEventTaxonomyMock } = vi.hoisted(() => ({
  fetchPublicEventTaxonomyMock: vi.fn(),
}))
vi.mock("@/features/events/server/public-taxonomy", () => ({
  fetchPublicEventTaxonomy: fetchPublicEventTaxonomyMock,
}))

import { GET, HEAD, OPTIONS } from "./route"

const taxonomy = {
  eventTypeGroups: [
    {
      id: "eventTaxonomyGroup-musikk",
      name: "Konserter",
      eventTypes: [{ id: "eventType-konsert", name: "Konsert" }],
    },
  ],
  rooms: [{ id: "room-teglverket", name: "Teglverket", slug: "teglverket" }],
}

describe("GET /api/v1/events/taxonomy", () => {
  beforeEach(() => fetchPublicEventTaxonomyMock.mockReset())

  it("returns default Norwegian taxonomy and cache/CORS headers", async () => {
    fetchPublicEventTaxonomyMock.mockResolvedValue(taxonomy)
    const response = await GET(
      new Request("https://example.test/api/v1/events/taxonomy"),
    )
    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=60, stale-while-revalidate=300",
    )
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    expect(await response.json()).toEqual(taxonomy)
    expect(fetchPublicEventTaxonomyMock).toHaveBeenCalledWith("nb")
  })

  it("supports English labels and conditional requests", async () => {
    fetchPublicEventTaxonomyMock.mockResolvedValue(taxonomy)
    const first = await GET(
      new Request("https://example.test/api/v1/events/taxonomy?locale=en"),
    )
    expect(fetchPublicEventTaxonomyMock).toHaveBeenCalledWith("en")
    const etag = first.headers.get("ETag")
    expect(etag).toBeTruthy()
    const second = await GET(
      new Request("https://example.test/api/v1/events/taxonomy?locale=en", {
        headers: { "If-None-Match": etag ?? "" },
      }),
    )
    expect(second.status).toBe(304)
    expect(second.body).toBeNull()
  })

  it("rejects unsupported parameters and locales", async () => {
    const badParam = await GET(
      new Request(
        "https://example.test/api/v1/events/taxonomy?from=2026-09-01",
      ),
    )
    const badLocale = await GET(
      new Request("https://example.test/api/v1/events/taxonomy?locale=de"),
    )
    expect(badParam.status).toBe(400)
    expect(badLocale.status).toBe(400)
    expect(fetchPublicEventTaxonomyMock).not.toHaveBeenCalled()
  })

  it("supports HEAD and OPTIONS", async () => {
    fetchPublicEventTaxonomyMock.mockResolvedValue(taxonomy)
    const head = await HEAD(
      new Request("https://example.test/api/v1/events/taxonomy"),
    )
    expect(head.status).toBe(200)
    expect(head.body).toBeNull()
    const options = OPTIONS()
    expect(options.status).toBe(204)
    expect(options.headers.get("Access-Control-Allow-Origin")).toBe("*")
  })
})
