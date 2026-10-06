import { beforeEach, expect, test, vi } from "vitest"

vi.mock("@/lib/integrations/kvarteret-personal/booking-requests", () => ({
  storeBookingRequest: vi.fn(),
}))
vi.mock("@/lib/integrations/crescat/client", () => ({
  postEventRequest: vi.fn(),
}))
vi.mock("@/lib/sanity/fetch", () => ({
  fetchHouseHours: vi.fn().mockResolvedValue(null),
}))
vi.mock("@/lib/opening-hours", async importOriginal => ({
  ...(await importOriginal<typeof import("@/lib/opening-hours")>()),
  isSlotAllowed: () => true,
}))
vi.mock("./karaoke-availability", () => ({
  fetchKaraokeAvailability: vi.fn().mockResolvedValue([]),
}))
vi.mock("@/lib/submission", () => ({
  captureSubmitFailure: vi.fn(),
  GENERIC_SUBMIT_ERROR: "Retry",
  INVALID_PAYLOAD_ERROR: "Invalid",
  RATE_LIMIT_ERROR: "Rate limited",
  TIME_PATTERN: /^([01]\d|2[0-3]):[0-5]\d$/,
  isSubmissionRateLimited: vi.fn().mockResolvedValue(false),
  getValidationDiagnostics: () => ({}),
}))
vi.mock("@/lib/booking/telemetry", () => ({
  captureBookingFailureEvent: vi.fn(),
  classifyBookingFailureStage: () => "unexpected",
  resolveSubmissionTelemetry: () => ({
    bookingSubmissionId: "e8f28cbf-4a3f-4ccf-b2ab-ae11a2041234",
    submissionAttempt: 1,
  }),
}))

import { postEventRequest } from "@/lib/integrations/crescat/client"
import { storeBookingRequest } from "@/lib/integrations/kvarteret-personal/booking-requests"
import { initialKaraokeState } from "../domain/formState"
import { submitKaraokeBooking } from "./submit-karaoke-booking"

const input = {
  ...initialKaraokeState,
  eventName: "Karaoke",
  startDate: "2026-10-15",
  startSlotMin: 1500,
  duration: 2 as const,
  contactName: "Kari",
  contactEmail: "kari@example.com",
  acceptTerms: true,
  studentProofAccepted: true,
}

beforeEach(() => {
  vi.mocked(storeBookingRequest).mockReset().mockResolvedValue("committed")
  vi.mocked(postEventRequest)
    .mockReset()
    .mockResolvedValue({ ok: true, value: 1 })
})

test("blocks Crescat when storage fails", async () => {
  vi.mocked(storeBookingRequest).mockRejectedValueOnce(new Error("db down"))
  expect((await submitKaraokeBooking(input)).ok).toBe(false)
  expect(postEventRequest).not.toHaveBeenCalled()
})

test("captures overnight session dates and prices before forwarding", async () => {
  let acknowledge!: (receipt: string) => void
  vi.mocked(storeBookingRequest).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        acknowledge = resolve
      }),
  )
  const pending = submitKaraokeBooking(input)
  await vi.waitFor(() => expect(storeBookingRequest).toHaveBeenCalledOnce())
  expect(postEventRequest).not.toHaveBeenCalled()
  const snapshot = vi.mocked(storeBookingRequest).mock.calls[0][0]
  expect(snapshot.schedule).toEqual([
    { date: "2026-10-16", doors_open: "01:00", doors_close: "03:00" },
  ])
  expect(snapshot.form).toEqual(expect.objectContaining({ totalPrice: 590 }))
  expect(snapshot.room_ids).toEqual([98])
  acknowledge("committed")
  expect((await pending).ok).toBe(true)
  expect(postEventRequest).toHaveBeenCalledWith(
    expect.any(String),
    snapshot.crescat_payload,
  )
})
