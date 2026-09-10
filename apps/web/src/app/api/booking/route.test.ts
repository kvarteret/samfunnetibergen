import { describe, expect, test, vi } from "vitest"

const { submitRoomBookingMock } = vi.hoisted(() => ({
  submitRoomBookingMock: vi.fn(),
}))

vi.mock("@/features/booking/actions/submit-room-booking", () => ({
  submitRoomBooking: submitRoomBookingMock,
}))

import { POST } from "./route"

// The cross-origin gate and body parsing live in the shared jsonPost helper
// (covered by lib/route-helpers.test.ts); this only proves the route wires the
// handler through to submitRoomBooking.
describe("POST /api/booking", () => {
  test("delegates to submitRoomBooking and returns its Result", async () => {
    submitRoomBookingMock
      .mockReset()
      .mockResolvedValue({ ok: true, value: 201 })

    const response = await POST(
      new Request("https://www.samfunnetibergen.no/api/booking", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://www.samfunnetibergen.no",
        },
        body: JSON.stringify({ eventName: "Testarrangement" }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true, value: 201 })
    expect(submitRoomBookingMock).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: "Testarrangement" }),
    )
  })
})
