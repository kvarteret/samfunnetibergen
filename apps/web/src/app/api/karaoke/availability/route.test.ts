import { describe, expect, test, vi } from "vitest"

const { fetchKaraokeAvailabilityMock } = vi.hoisted(() => ({
  fetchKaraokeAvailabilityMock: vi.fn(),
}))

vi.mock("@/features/karaoke/actions/karaoke-availability", () => ({
  fetchKaraokeAvailability: fetchKaraokeAvailabilityMock,
}))

import { GET } from "./route"

function request(url: string): Request {
  return new Request(url)
}

describe("GET /api/karaoke/availability", () => {
  test("returns bookings for valid dates", async () => {
    fetchKaraokeAvailabilityMock
      .mockReset()
      .mockResolvedValue([{ id: 1, resourceId: 95 }])

    const response = await GET(
      request(
        "https://www.samfunnetibergen.no/api/karaoke/availability?start=2026-12-24&end=2026-12-25",
      ),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([{ id: 1, resourceId: 95 }])
    expect(fetchKaraokeAvailabilityMock).toHaveBeenCalledWith(
      "2026-12-24",
      "2026-12-25",
    )
  })

  test("rejects invalid dates", async () => {
    fetchKaraokeAvailabilityMock.mockClear()

    const response = await GET(
      request(
        "https://www.samfunnetibergen.no/api/karaoke/availability?start=bad&end=also-bad",
      ),
    )

    expect(response.status).toBe(400)
    expect(fetchKaraokeAvailabilityMock).not.toHaveBeenCalled()
  })
})
