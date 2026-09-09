import { describe, expect, test, vi } from "vitest"

const { fetchRoomAvailabilityMock } = vi.hoisted(() => ({
  fetchRoomAvailabilityMock: vi.fn(),
}))

vi.mock("@/features/booking/actions/room-availability", () => ({
  fetchRoomAvailability: fetchRoomAvailabilityMock,
}))

import { GET } from "./route"

function request(url: string): Request {
  return new Request(url)
}

describe("GET /api/booking/availability", () => {
  test("returns bookings for valid parameters", async () => {
    fetchRoomAvailabilityMock
      .mockReset()
      .mockResolvedValue([{ id: 1, resourceId: 95 }])

    const response = await GET(
      request(
        "https://www.samfunnetibergen.no/api/booking/availability?bookerType=intern&start=2026-12-24&end=2026-12-25",
      ),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([{ id: 1, resourceId: 95 }])
    expect(fetchRoomAvailabilityMock).toHaveBeenCalledWith(
      "intern",
      "2026-12-24",
      "2026-12-25",
    )
  })

  test("rejects invalid parameters", async () => {
    fetchRoomAvailabilityMock.mockClear()

    const response = await GET(
      request(
        "https://www.samfunnetibergen.no/api/booking/availability?bookerType=bogus&start=bad&end=also-bad",
      ),
    )

    expect(response.status).toBe(400)
    expect(fetchRoomAvailabilityMock).not.toHaveBeenCalled()
  })
})
