import { beforeEach, describe, expect, test, vi } from "vitest"

const { captureExceptionMock, fetchMock } = vi.hoisted(() => ({
  captureExceptionMock: vi.fn(),
  fetchMock: vi.fn(),
}))

vi.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => ({ captureException: captureExceptionMock }),
}))

vi.stubGlobal("fetch", fetchMock)

import { fetchVenueCalendar } from "./calendar"

describe("fetchVenueCalendar", () => {
  beforeEach(() => {
    captureExceptionMock.mockReset()
    fetchMock.mockReset()
  })

  test("captures a diagnostic exception when Crescat rejects the request", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 503 }))

    const result = await fetchVenueCalendar(
      "studentersamfunnet-i-bergen-bookingkalender",
      "2026-09-10",
      "2026-09-11",
    )

    expect(result).toEqual([])
    expect(captureExceptionMock).toHaveBeenCalledWith(
      new Error("Crescat calendar request failed with status 503"),
      "anonymous",
      expect.objectContaining({
        calendar_slug: "studentersamfunnet-i-bergen-bookingkalender",
        end_date: "2026-09-11",
        failure_branch: "calendar_http_error",
        handled: true,
        http_status: 503,
        integration: "crescat",
        operation: "calendar_fetch",
        source: "crescat-calendar",
        start_date: "2026-09-10",
        workflow: "server_request",
      }),
    )
  })
})
