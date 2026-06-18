import { describe, expect, test, vi, beforeEach } from "vitest"

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
  fetchVenueCalendar: vi.fn().mockResolvedValue([]),
}))

vi.mock("@/lib/sanity/fetch", () => ({
  fetchBookableRooms: vi.fn().mockResolvedValue([]),
  fetchHouseHours: vi.fn().mockResolvedValue(null),
}))

import { submitRoomBooking } from "./submit-room-booking"
import type { RoomBookingPayload } from "./submit-room-booking"

// ── Helpers ─────────────────────────────────────────────────────────────────

function standardPayload(
  overrides: Partial<RoomBookingPayload> = {},
): RoomBookingPayload {
  return {
    bookerType: "ekstern",
    eventName: "Testarrangement",
    roomIds: [95],
    startDate: "2026-12-24",
    startTime: "20:00",
    endTime: "23:00",
    description: "En test.",
    audienceCount: 50,
    openOrClosed: "Åpent",
    furniture: "Bord og stoler",
    techEquipment: "Projektor",
    cateringWishes: "",
    freeOrPaid: "Gratis",
    ticketTypes: "",
    contactName: "Test Testesen",
    contactEmail: "test@example.com",
    contactPhone: "12345678",
    acceptTerms: true,
    ...overrides,
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("submitRoomBooking", () => {
  beforeEach(() => {
    fetchMock.mockReset()
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

    await submitRoomBooking(standardPayload())

    const calls = fetchMock.mock.calls as Array<[string, RequestInit]>
    expect(calls.some(([url]) => url.includes("bookingskjema-standard"))).toBe(
      true,
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
  })
})
