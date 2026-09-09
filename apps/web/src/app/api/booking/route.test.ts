import { describe, expect, test, vi } from "vitest"

const { submitRoomBookingMock } = vi.hoisted(() => ({
  submitRoomBookingMock: vi.fn(),
}))

vi.mock("@/features/booking/actions/submit-room-booking", () => ({
  submitRoomBooking: submitRoomBookingMock,
}))

import { POST } from "./route"

function bookingRequest(init?: {
  origin?: string
  host?: string
  body?: string
}): Request {
  const { origin, host, body } = init ?? {}
  const headers: Record<string, string> = { "content-type": "application/json" }
  if (origin !== undefined) headers.origin = origin
  if (host !== undefined) headers.host = host
  return new Request("https://www.samfunnetibergen.no/api/booking", {
    method: "POST",
    headers,
    body: body ?? JSON.stringify({ eventName: "Testarrangement" }),
  })
}

describe("POST /api/booking", () => {
  test("rejects a cross-origin request before delegating", async () => {
    submitRoomBookingMock.mockClear()

    const response = await POST(
      bookingRequest({ origin: "https://evil.example.com" }),
    )

    expect(response.status).toBe(403)
    expect(submitRoomBookingMock).not.toHaveBeenCalled()
  })

  test("accepts a same-origin request and returns the Result", async () => {
    submitRoomBookingMock
      .mockReset()
      .mockResolvedValue({ ok: true, value: 201 })

    const response = await POST(
      bookingRequest({ origin: "https://www.samfunnetibergen.no" }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true, value: 201 })
    expect(submitRoomBookingMock).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: "Testarrangement" }),
    )
  })

  test("allows a request without an Origin header (non-browser caller)", async () => {
    submitRoomBookingMock
      .mockReset()
      .mockResolvedValue({ ok: false, error: "x" })

    const response = await POST(bookingRequest())

    expect(response.status).toBe(200)
    expect(submitRoomBookingMock).toHaveBeenCalled()
  })

  test("rejects a malformed JSON body", async () => {
    submitRoomBookingMock.mockClear()

    const response = await POST(
      bookingRequest({
        origin: "https://www.samfunnetibergen.no",
        body: "not json",
      }),
    )

    expect(response.status).toBe(400)
    expect(submitRoomBookingMock).not.toHaveBeenCalled()
  })

  test("rejects a non-object JSON body", async () => {
    submitRoomBookingMock.mockClear()

    const response = await POST(
      bookingRequest({
        origin: "https://www.samfunnetibergen.no",
        body: '"just a string"',
      }),
    )

    expect(response.status).toBe(400)
    expect(submitRoomBookingMock).not.toHaveBeenCalled()
  })
})
