import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/features/events/server/public-events", () => ({
  fetchPublicEventBySlug: vi.fn(),
}))
vi.mock("@/features/event-interest/server/store", () => ({
  readInterest: vi.fn(),
  saveInterest: vi.fn(),
}))

import {
  readInterest,
  saveInterest,
} from "@/features/event-interest/server/store"
import { fetchPublicEventBySlug } from "@/features/events/server/public-events"
import { GET, POST } from "./route"

const context = { params: Promise.resolve({ slug: "test-event" }) }
function request(
  body: unknown,
  origin = "https://example.com",
  cookie?: string,
) {
  return new NextRequest("https://example.com/api/event-interest/test-event", {
    method: "POST",
    headers: {
      origin,
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("EVENT_INTEREST_SECRET", "a".repeat(32))
  vi.mocked(fetchPublicEventBySlug).mockResolvedValue({
    event: { _id: "event-id", eventStatus: "scheduled" },
    children: [],
  } as unknown as NonNullable<
    Awaited<ReturnType<typeof fetchPublicEventBySlug>>
  >)
  vi.mocked(readInterest).mockResolvedValue({ taps: 0, score: 0 })
  vi.mocked(saveInterest).mockResolvedValue({ taps: 4, score: 0.75 })
})
describe("public event responses", () => {
  it("rejects cross-origin and invalid counts without backend writes", async () => {
    expect(
      (await POST(request({ taps: 4 }, "https://elsewhere.com"), context))
        .status,
    ).toBe(403)
    for (const taps of [-1, 13, 1.5, "4", true])
      expect((await POST(request({ taps }), context)).status).toBe(400)
    expect(saveInterest).not.toHaveBeenCalled()
  })
  it("persists a bounded response and sets a scoped HttpOnly cookie only on interaction", async () => {
    const response = await POST(request({ taps: 4 }), context)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ taps: 4, score: 0.75 })
    expect(response.headers.get("set-cookie")).toContain("HttpOnly")
    expect(response.headers.get("set-cookie")).toContain(
      "Path=/api/event-interest",
    )
    const cookie = response.headers.get("set-cookie")?.split(";")[0]
    await POST(request({ taps: 8 }, undefined, cookie), context)
    expect(vi.mocked(saveInterest).mock.calls[0][1]).toBe(
      vi.mocked(saveInterest).mock.calls[1][1],
    )
  })
  it("establishes a source before writing so a lost first response cannot duplicate it", async () => {
    const response = await POST(request({ initialize: true }), context)
    expect(response.status).toBe(200)
    expect(response.headers.get("set-cookie")).toContain("HttpOnly")
    expect(saveInterest).not.toHaveBeenCalled()
  })
  it("reads without creating cookies and avoids caching source-specific data", async () => {
    const response = await GET(
      new NextRequest("https://example.com/api/event-interest/test-event"),
      context,
    )
    expect(response.headers.get("set-cookie")).toBeNull()
    expect(response.headers.get("cache-control")).toContain("no-store")
  })
  it("rejects unpublished or cancelled events and fails honestly when unavailable", async () => {
    vi.mocked(fetchPublicEventBySlug).mockResolvedValue(null)
    expect((await POST(request({ taps: 4 }), context)).status).toBe(404)
    expect(saveInterest).not.toHaveBeenCalled()
    vi.mocked(fetchPublicEventBySlug).mockRejectedValue(
      new Error("unavailable"),
    )
    expect(
      (
        await GET(
          new NextRequest("https://example.com/api/event-interest/test-event"),
          context,
        )
      ).status,
    ).toBe(503)
  })
})
