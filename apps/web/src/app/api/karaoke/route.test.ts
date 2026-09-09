import { describe, expect, test, vi } from "vitest"

const { submitKaraokeBookingMock } = vi.hoisted(() => ({
  submitKaraokeBookingMock: vi.fn(),
}))

vi.mock("@/features/karaoke/actions/submit-karaoke-booking", () => ({
  submitKaraokeBooking: submitKaraokeBookingMock,
}))

import { POST } from "./route"

function karaokeRequest(init?: { origin?: string; body?: string }): Request {
  const headers: Record<string, string> = { "content-type": "application/json" }
  if (init?.origin !== undefined) headers.origin = init.origin
  return new Request("https://www.samfunnetibergen.no/api/karaoke", {
    method: "POST",
    headers,
    body: init?.body ?? JSON.stringify({ eventName: "Test" }),
  })
}

describe("POST /api/karaoke", () => {
  test("rejects a cross-origin request before delegating", async () => {
    submitKaraokeBookingMock.mockClear()

    const response = await POST(
      karaokeRequest({ origin: "https://evil.example.com" }),
    )

    expect(response.status).toBe(403)
    expect(submitKaraokeBookingMock).not.toHaveBeenCalled()
  })

  test("accepts a same-origin request and returns the Result", async () => {
    submitKaraokeBookingMock
      .mockReset()
      .mockResolvedValue({ ok: true, value: 201 })

    const response = await POST(
      karaokeRequest({ origin: "https://www.samfunnetibergen.no" }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true, value: 201 })
    expect(submitKaraokeBookingMock).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: "Test" }),
    )
  })

  test("rejects a malformed JSON body", async () => {
    submitKaraokeBookingMock.mockClear()

    const response = await POST(
      karaokeRequest({
        origin: "https://www.samfunnetibergen.no",
        body: "not json",
      }),
    )

    expect(response.status).toBe(400)
    expect(submitKaraokeBookingMock).not.toHaveBeenCalled()
  })
})
