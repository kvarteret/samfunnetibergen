import type { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  parse: vi.fn(),
  fetch: vi.fn(),
  create: vi.fn(),
  capture: vi.fn(),
}))
vi.mock("next-sanity/webhook", () => ({ parseBody: mocks.parse }))
vi.mock("@/lib/sanity/client", () => ({
  sanityClient: {
    withConfig: () => ({
      fetch: mocks.fetch,
      createIfNotExists: mocks.create,
      patch: () => ({ setIfMissing: () => ({ commit: async () => ({}) }) }),
    }),
  },
}))
vi.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => ({ captureImmediate: mocks.capture }),
}))

import { POST } from "./route"

const change = {
  eventId: "snooks",
  revision: "rev1",
  changedAt: "2026-10-06T16:56:52Z",
  title: "The Snooks",
  slug: "snooks",
  before: { promoted: false, placement: null, order: null },
  after: { promoted: true, placement: "top", order: 0 },
}
function request(body = "{}", signed = true) {
  return new Request("https://example.test/api/webhooks/event-promotion", {
    method: "POST",
    body,
    headers: signed ? { "sanity-webhook-signature": "signature" } : {},
  }) as NextRequest
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("SANITY_PROMOTION_WEBHOOK_SECRET", "secret")
  vi.stubEnv("SANITY_WRITE_TOKEN", "token")
  mocks.parse.mockResolvedValue({ isValidSignature: true, body: change })
  mocks.create.mockImplementation(async document => document)
  mocks.capture.mockResolvedValue(undefined)
})
afterEach(() => vi.unstubAllEnvs())
describe("promotion webhook", () => {
  it("rejects unsigned, invalid-signature, oversized and malformed requests before writes", async () => {
    expect((await POST(request("{}", false))).status).toBe(401)
    expect((await POST(request("x".repeat(8193)))).status).toBe(413)
    mocks.parse.mockResolvedValue({ isValidSignature: false, body: change })
    expect((await POST(request())).status).toBe(401)
    mocks.parse.mockResolvedValue({ isValidSignature: true, body: {} })
    expect((await POST(request())).status).toBe(400)
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it("awaits export and preserves timestamps and stable retry IDs without CMS history writes", async () => {
    expect((await POST(request())).status).toBe(200)
    expect((await POST(request())).status).toBe(200)
    const first = mocks.capture.mock.calls[0][0]
    expect(first.timestamp).toEqual(new Date(change.changedAt))
    expect(first.properties.change).toBe("started")
    expect(first.properties.$insert_id).toBe(
      first.properties.promotion_campaign_id,
    )
    expect(mocks.capture.mock.calls[1][0].properties.$insert_id).toBe(
      first.properties.$insert_id,
    )
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it("exports out-of-order placement changes independently; PostHog joins by event and time", async () => {
    mocks.parse.mockResolvedValue({
      isValidSignature: true,
      body: { ...change, before: { ...change.after, order: 2 } },
    })
    mocks.fetch.mockResolvedValue("initial-slug")
    expect((await POST(request())).status).toBe(200)
    expect(mocks.capture).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          event_id: "initial-slug",
          change: "placement_changed",
          promotion_campaign_id: null,
        }),
      }),
    )
    expect(mocks.create).not.toHaveBeenCalled()
  })
  it("returns a retryable failure when PostHog export fails", async () => {
    mocks.capture.mockRejectedValueOnce(new Error("upstream unavailable"))
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    expect((await POST(request())).status).toBe(502)
    log.mockRestore()
  })
})
