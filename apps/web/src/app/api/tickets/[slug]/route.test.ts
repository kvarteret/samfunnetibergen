import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const fetchPublicEventBySlugMock = vi.hoisted(() => vi.fn())
const captureMock = vi.hoisted(() => vi.fn())

vi.mock("@/features/events/server/public-events", () => ({
  fetchPublicEventBySlug: fetchPublicEventBySlugMock,
}))
vi.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => ({
    capture: captureMock,
    flush: vi.fn().mockResolvedValue(undefined),
  }),
}))
vi.mock("next/server", async importOriginal => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (callback: () => unknown) => callback(),
}))

import { GET } from "./route"

function call(slug: string, query = "") {
  return GET(
    new NextRequest(
      `https://www.samfunnetibergen.no/api/tickets/${slug}${query}`,
    ),
    { params: Promise.resolve({ slug }) },
  )
}

describe("GET /api/tickets/[slug]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchPublicEventBySlugMock.mockResolvedValue({
      event: {
        _id: "e1",
        title: "Pub HD",
        ticketUrl: "https://hoopla.example.test/pubhd",
        dates: [
          { _key: "d1", ticketUrl: "https://hoopla.example.test/pubhd" },
          { _key: "d2", ticketUrl: "https://hoopla.example.test/pubhd-2" },
        ],
      },
    })
  })

  it("redirects to the ticket shop and records the click with UTM data", async () => {
    const response = await call("pubhd", "?utm_source=broadcast&x=1")

    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toBe(
      "https://hoopla.example.test/pubhd?utm_source=broadcast",
    )
    expect(captureMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "ticket_link_clicked",
        properties: expect.objectContaining({
          event_slug: "pubhd",
          utm_source: "broadcast",
          source: "ticket_proxy",
        }),
      }),
    )
  })

  it("redirects to the ticket page of the requested date", async () => {
    const response = await call("pubhd", "?date=d2")

    expect(response.headers.get("location")).toBe(
      "https://hoopla.example.test/pubhd-2",
    )
  })

  it("falls back to the event ticket URL for an unknown date", async () => {
    const response = await call("pubhd", "?date=zzz")

    expect(response.headers.get("location")).toBe(
      "https://hoopla.example.test/pubhd",
    )
  })

  it("falls back to the event page when there is no ticket URL", async () => {
    fetchPublicEventBySlugMock.mockResolvedValue({
      event: { _id: "e1", title: "Pub HD", ticketUrl: null, dates: [] },
    })
    const response = await call("pubhd")

    expect(response.headers.get("location")).toBe(
      "https://www.samfunnetibergen.no/nb/arrangementer/pubhd",
    )
    expect(captureMock).not.toHaveBeenCalled()
  })

  it("falls back to the event list for unknown events", async () => {
    fetchPublicEventBySlugMock.mockResolvedValue(null)
    const response = await call("nope")

    expect(response.headers.get("location")).toBe(
      "https://www.samfunnetibergen.no/nb/arrangementer/",
    )
  })
})
