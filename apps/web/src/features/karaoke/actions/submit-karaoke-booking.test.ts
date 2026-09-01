import { beforeEach, describe, expect, test, vi } from "vitest"

const {
  captureSubmitFailureMock,
  fetchHouseHoursMock,
  fetchKaraokeAvailabilityMock,
  postEventRequestMock,
  posthogCaptureMock,
  rateLimitMock,
} = vi.hoisted(() => ({
  captureSubmitFailureMock: vi.fn(),
  fetchHouseHoursMock: vi.fn(),
  fetchKaraokeAvailabilityMock: vi.fn(),
  postEventRequestMock: vi.fn(),
  posthogCaptureMock: vi.fn(),
  rateLimitMock: vi.fn(),
}))

vi.mock("@/lib/integrations/crescat/client", () => ({
  postEventRequest: postEventRequestMock,
}))

vi.mock(import("@/lib/opening-hours"), async importOriginal => ({
  ...(await importOriginal()),
  isSlotAllowed: vi.fn().mockReturnValue(true),
}))

vi.mock("@/lib/sanity/fetch", () => ({
  fetchHouseHours: fetchHouseHoursMock,
}))

vi.mock("@/lib/submission", () => ({
  captureSubmitFailure: captureSubmitFailureMock,
  getValidationDiagnostics: vi.fn(),
  GENERIC_SUBMIT_ERROR: "Noe gikk galt.",
  INVALID_PAYLOAD_ERROR: "Ugyldig skjema.",
  isSubmissionRateLimited: rateLimitMock,
  RATE_LIMIT_ERROR: "For mange forsøk.",
  TIME_PATTERN: /^([01]\d|2[0-3]):[0-5]\d$/,
}))

vi.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => ({ capture: posthogCaptureMock }),
}))

vi.mock("./karaoke-availability", () => ({
  fetchKaraokeAvailability: fetchKaraokeAvailabilityMock,
}))

import { initialKaraokeState } from "../domain/formState"
import { submitKaraokeBooking } from "./submit-karaoke-booking"

describe("submitKaraokeBooking", () => {
  beforeEach(() => {
    captureSubmitFailureMock.mockReset()
    fetchHouseHoursMock.mockReset().mockResolvedValue(null)
    fetchKaraokeAvailabilityMock.mockReset().mockResolvedValue([])
    postEventRequestMock.mockReset().mockResolvedValue({ ok: true, value: 201 })
    posthogCaptureMock.mockReset()
    rateLimitMock.mockReset().mockResolvedValue(false)
  })

  test("leaves successful funnel analytics to the browser form", async () => {
    const result = await submitKaraokeBooking({
      ...initialKaraokeState,
      eventName: "Testarrangement",
      startDate: "2026-12-24",
      startSlotMin: 19 * 60,
      contactName: "Kari Nordmann",
      contactEmail: "kari@example.com",
      acceptTerms: true,
      studentProofAccepted: true,
    })

    expect(result).toEqual({ ok: true, value: 201 })
    expect(postEventRequestMock).toHaveBeenCalledOnce()
    expect(posthogCaptureMock).not.toHaveBeenCalled()
  })
})
