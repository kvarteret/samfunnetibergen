import { describe, expect, test, vi } from "vitest"

const { fetchBookableRoomsForBookerMock } = vi.hoisted(() => ({
  fetchBookableRoomsForBookerMock: vi.fn(),
}))

vi.mock("@/features/booking/actions/bookable-rooms", () => ({
  fetchBookableRoomsForBooker: fetchBookableRoomsForBookerMock,
}))

import { GET } from "./route"

function request(url: string): Request {
  return new Request(url)
}

describe("GET /api/booking/rooms", () => {
  test("returns rooms for a valid booker type", async () => {
    fetchBookableRoomsForBookerMock
      .mockReset()
      .mockResolvedValue([{ crescatRoomId: 95, title: "Speilsalen" }])

    const response = await GET(
      request(
        "https://www.samfunnetibergen.no/api/booking/rooms?bookerType=ekstern",
      ),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([
      { crescatRoomId: 95, title: "Speilsalen" },
    ])
    expect(fetchBookableRoomsForBookerMock).toHaveBeenCalledWith("ekstern")
  })

  test("rejects an invalid booker type", async () => {
    fetchBookableRoomsForBookerMock.mockClear()

    const response = await GET(
      request(
        "https://www.samfunnetibergen.no/api/booking/rooms?bookerType=bogus",
      ),
    )

    expect(response.status).toBe(400)
    expect(fetchBookableRoomsForBookerMock).not.toHaveBeenCalled()
  })
})
