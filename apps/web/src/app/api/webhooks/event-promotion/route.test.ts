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
  vi.stubEnv("SANITY_PROMOTION_HISTORY_TOKEN", "token")
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
  it("persists starts before awaiting export and preserves timestamps and dedup IDs", async () => {
    expect((await POST(request())).status).toBe(200)
    const document = mocks.create.mock.calls[0][0]
    expect(document.kind).toBe("started")
    expect(mocks.capture).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: new Date(change.changedAt),
        properties: expect.objectContaining({
          $insert_id: document._id,
          promotion_campaign_id: document._id,
        }),
      }),
    )
    expect(mocks.create.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.capture.mock.invocationCallOrder[0],
    )
  })
  it("retries placement changes delivered before the campaign start", async () => {
    mocks.parse.mockResolvedValue({
      isValidSignature: true,
      body: { ...change, before: { ...change.after, order: 2 } },
    })
    mocks.fetch.mockResolvedValue(null)
    expect((await POST(request())).status).toBe(503)
    expect(mocks.create).not.toHaveBeenCalled()
    mocks.fetch.mockResolvedValue("original-campaign")
    expect((await POST(request())).status).toBe(200)
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ campaignId: "original-campaign" }),
    )
  })
})
