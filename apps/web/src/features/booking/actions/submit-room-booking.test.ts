import { beforeEach, describe, expect, test, vi } from "vitest"

const {
  captureExceptionMock,
  emitOperationalEventMock,
  fetchVenueCalendarMock,
  posthogCaptureMock,
  spanSetAttributeMock,
} = vi.hoisted(() => ({
  captureExceptionMock: vi.fn(),
  emitOperationalEventMock: vi.fn(),
  fetchVenueCalendarMock: vi.fn(),
  posthogCaptureMock: vi.fn(),
  spanSetAttributeMock: vi.fn(),
}))

vi.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => ({
    capture: posthogCaptureMock,
    captureException: captureExceptionMock,
  }),
}))

vi.mock("@/lib/observability", () => ({
  currentTraceFields: () => ({
    trace_id: "abcdef0123456789abcdef0123456789",
    span_id: "abcdef0123456789",
  }),
  emitOperationalEvent: emitOperationalEventMock,
  injectActiveTraceContext: (headers: Record<string, string>) => {
    headers.traceparent =
      "00-abcdef0123456789abcdef0123456789-abcdef0123456789-01"
  },
  withOperationalSpan: async (
    _name: string,
    run: (span: {
      setAttribute: typeof spanSetAttributeMock
    }) => Promise<unknown>,
  ) => run({ setAttribute: spanSetAttributeMock }),
}))

// ── Mock rate-limit (Next.js headers() unavailable in vitest) ──────────────

vi.mock("@/lib/rate-limit", () => ({
  getClientIp: vi.fn().mockResolvedValue("127.0.0.1"),
  checkRateLimit: vi.fn().mockReturnValue(true),
}))

// ── Mock network + Sanity ───────────────────────────────────────────────────

const fetchMock = vi.fn()
vi.stubGlobal("fetch", fetchMock)

vi.mock("@/lib/integrations/crescat/calendar", () => ({
  calendarSlugForBookerType: vi.fn((type: string) =>
    type === "intern"
      ? "studentersamfunnet-i-bergen-bookingkalender-privat"
      : "studentersamfunnet-i-bergen-bookingkalender",
  ),
  fetchVenueCalendar: fetchVenueCalendarMock,
}))

vi.mock("@/lib/sanity/fetch", () => ({
  fetchBookableRooms: vi.fn().mockResolvedValue([]),
  fetchHouseHours: vi.fn().mockResolvedValue(null),
}))

import type { BookingFormState } from "../domain/bookingFormSchema"
import { initialBookingState } from "../domain/formState"
import { submitRoomBooking } from "./submit-room-booking"

// ── Helpers ─────────────────────────────────────────────────────────────────

function standardPayload(
  overrides: Partial<BookingFormState> = {},
): BookingFormState {
  return {
    ...initialBookingState,
    bookerType: "ekstern",
    eventName: "Testarrangement",
    selectedRoomIds: [95],
    startDate: "2026-12-24",
    startTime: "20:00",
    endTime: "23:00",
    doorsTimes: ["19:00"],
    description: "En test.",
    audienceCount: "50",
    openOrClosed: "Åpent",
    furniture: "Bord og stoler",
    freeOrPaid: "Gratis",
    contactName: "Test Testesen",
    contactEmail: "test@example.com",
    contactPhone: "+4740612345",
    acceptTerms: true,
    invoiceAddress: "Testadresse 1",
    ...overrides,
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("submitRoomBooking", () => {
  beforeEach(() => {
    captureExceptionMock.mockReset()
    emitOperationalEventMock.mockReset()
    fetchMock.mockReset()
    fetchVenueCalendarMock.mockReset().mockResolvedValue([])
    posthogCaptureMock.mockReset()
    spanSetAttributeMock.mockReset()
  })

  test("rejects payload with missing required field", async () => {
    const result = await submitRoomBooking({
      ...standardPayload(),
      eventName: "",
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain("ufullstendig")
    }
    // No fetch should have been made.
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test("rejects payload with invalid email", async () => {
    const result = await submitRoomBooking({
      ...standardPayload(),
      contactEmail: "ikke-en-epost",
    })
    expect(result.ok).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test("records an authoritative calendar-conflict rejection", async () => {
    fetchVenueCalendarMock.mockResolvedValueOnce([
      {
        id: 394377,
        resourceId: 95,
        event_id: 310742,
        start: "2026-12-24T19:00:00",
        end: "2026-12-24T21:00:00",
        color: "",
        title: "Existing booking",
        part_of_event: false,
      },
    ])

    const result = await submitRoomBooking(standardPayload())

    expect(result).toEqual({
      ok: false,
      error:
        "Valgt tidsrom overlapper en eksisterende booking. Velg et annet tidspunkt.",
    })
    expect(posthogCaptureMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "room_booking_rejected",
        properties: expect.objectContaining({
          failure_reason: "calendar_conflict",
          room_ids: [95],
          source: "server_validation",
          start_date: "2026-12-24",
          start_time: "20:00",
        }),
      }),
    )
    expect(emitOperationalEventMock).toHaveBeenCalledWith(
      "booking.rejected",
      expect.objectContaining({
        failure_stage: "calendar_conflict",
        outcome: "rejected",
      }),
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test("posts to the correct slug for ekstern booker", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response("", {
          status: 200,
          headers: [
            ["set-cookie", "XSRF-TOKEN=abc123; Path=/"],
            ["set-cookie", "crescat_session=xyz; Path=/"],
          ],
        }),
      )
      .mockResolvedValueOnce(new Response("", { status: 201 }))

    const bookingSubmissionId = "123e4567-e89b-42d3-a456-426614174000"
    await submitRoomBooking({
      ...standardPayload(),
      bookingSubmissionId,
      submissionAttempt: 2,
    })

    const calls = fetchMock.mock.calls as Array<[string, RequestInit]>
    expect(calls.some(([url]) => url.includes("bookingskjema-standard"))).toBe(
      true,
    )
    const postHeaders = calls[1]?.[1].headers as Record<string, string>
    expect(postHeaders.traceparent).toBe(
      "00-abcdef0123456789abcdef0123456789-abcdef0123456789-01",
    )
    const successProperties = posthogCaptureMock.mock.calls[0]?.[0].properties
    expect(successProperties.booking_submission_id).toBe(bookingSubmissionId)
    expect(successProperties.submission_attempt).toBe(2)
    expect(successProperties.trace_id).toBe("abcdef0123456789abcdef0123456789")
    expect(emitOperationalEventMock).toHaveBeenCalledWith(
      "booking.submitted",
      expect.objectContaining({
        booking_submission_id: successProperties.booking_submission_id,
        crescat_http_status: 201,
        outcome: "accepted",
      }),
    )
  })

  test("sends x-xsrf-token header on POST", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response("", {
          status: 200,
          headers: [
            ["set-cookie", "XSRF-TOKEN=abc123; Path=/"],
            ["set-cookie", "crescat_session=xyz; Path=/"],
          ],
        }),
      )
      .mockResolvedValueOnce(new Response("", { status: 201 }))

    await submitRoomBooking(standardPayload())

    const calls = fetchMock.mock.calls as Array<[string, RequestInit]>
    const postCall = calls[1]
    expect(postCall).toBeDefined()
    const headers = postCall[1].headers as Record<string, string>
    expect(headers["x-xsrf-token"]).toBe("abc123")
  })

  test("echoes both cookies on POST", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response("", {
          status: 200,
          headers: [
            ["set-cookie", "XSRF-TOKEN=tok%3D; Path=/"],
            ["set-cookie", "crescat_session=sess123; Path=/"],
          ],
        }),
      )
      .mockResolvedValueOnce(new Response("", { status: 201 }))

    await submitRoomBooking(standardPayload())

    const calls = fetchMock.mock.calls as Array<[string, RequestInit]>
    const postCall = calls[1]
    const headers = postCall[1].headers as Record<string, string>
    expect(headers.cookie).toContain("crescat_session=sess123")
    // URL-decoded: tok%3D → tok=
    expect(headers["x-xsrf-token"]).toBe("tok=")
  })

  test("includes new fields in POST body", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response("", {
          status: 200,
          headers: [
            ["set-cookie", "XSRF-TOKEN=abc; Path=/"],
            ["set-cookie", "crescat_session=xyz; Path=/"],
          ],
        }),
      )
      .mockResolvedValueOnce(new Response("", { status: 201 }))

    await submitRoomBooking(
      standardPayload({
        needsAmphi: true,
        barSelf: false,
        barKvarteret: true,
      }),
    )

    const calls = fetchMock.mock.calls as Array<[string, RequestInit]>
    const body = JSON.parse(calls[1][1].body as string)

    // Find NEEDS_AMPHI (80461) in sections
    const metaFields = body.sections
      .filter((s: { type: string }) => s.type === "metaData")
      .flatMap(
        (s: { content: { fields: Array<{ id: number; value: unknown }> } }) =>
          s.content.fields,
      )

    const amphi = metaFields.find((f: { id: number }) => f.id === 80461)
    expect(amphi).toBeDefined()
    expect(amphi.value).toBe(true)

    const barSelf = metaFields.find((f: { id: number }) => f.id === 4365154)
    expect(barSelf).toBeDefined()
    expect(barSelf.value).toBe(false)

    const barKvarteret = metaFields.find(
      (f: { id: number }) => f.id === 4382234,
    )
    expect(barKvarteret).toBeDefined()
    expect(barKvarteret.value).toBe(true)
  })

  test("returns error on POST non-2xx", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response("", {
          status: 200,
          headers: [
            ["set-cookie", "XSRF-TOKEN=abc; Path=/"],
            ["set-cookie", "crescat_session=xyz; Path=/"],
          ],
        }),
      )
      .mockResolvedValueOnce(new Response("", { status: 422 }))

    const result = await submitRoomBooking(standardPayload())
    expect(result.ok).toBe(false)
    expect(captureExceptionMock.mock.calls[0]?.[0]).toEqual(
      new Error("Bookingsystemet svarte med status 422."),
    )
    expect(posthogCaptureMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "room_booking_submit_failed",
        properties: expect.objectContaining({
          failure_stage: "crescat_response",
          submission_attempt: 1,
        }),
      }),
    )
  })
})
