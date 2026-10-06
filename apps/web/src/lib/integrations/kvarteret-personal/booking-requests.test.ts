import { afterEach, expect, test, vi } from "vitest"
import {
  type BookingSnapshot,
  bookingAuthHeaders,
  storeBookingRequest,
} from "./booking-requests"

const id = "123e4567-e89b-42d3-a456-426614174001"
const snapshot: BookingSnapshot = {
  schema_version: 1,
  submission_id: id,
  kind: "room",
  event_name: "Test",
  contact_name: "Kari",
  contact_email: "kari@example.com",
  room_ids: [97],
  schedule: [{ date: "2026-10-10", doors_open: "20:00", doors_close: "02:00" }],
  form: {},
  crescat_payload: {} as BookingSnapshot["crescat_payload"],
}
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})
test("retries storage with identical snapshot and fresh signed nonce", async () => {
  vi.stubEnv(
    "VOLUNTEER_PROSPECT_HMAC_SECRET",
    "0123456789abcdef0123456789abcdef",
  )
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response("", { status: 503 }))
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          booking_request_id: id,
          submission_id: id,
          content_hash: "a".repeat(64),
        }),
        { status: 201 },
      ),
    )
  vi.stubGlobal("fetch", fetch)
  expect(await storeBookingRequest(snapshot)).toBe(id)
  expect(fetch.mock.calls[0][1].body).toBe(fetch.mock.calls[1][1].body)
  expect(fetch.mock.calls[0][1].headers["X-Kvarteret-Nonce"]).not.toBe(
    fetch.mock.calls[1][1].headers["X-Kvarteret-Nonce"],
  )
})
test("fails without storage configuration or a committed receipt", async () => {
  vi.stubEnv("VOLUNTEER_PROSPECT_HMAC_SECRET", "")
  await expect(storeBookingRequest(snapshot)).rejects.toThrow()
  vi.stubEnv(
    "VOLUNTEER_PROSPECT_HMAC_SECRET",
    "0123456789abcdef0123456789abcdef",
  )
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("", { status: 503 })),
  )
  await expect(storeBookingRequest(snapshot)).rejects.toThrow(
    "Booking storage failed",
  )
})
test("signature binds snapshot and submission identity", () => {
  const secret = "0123456789abcdef0123456789abcdef"
  const nonce = "123e4567-e89b-42d3-a456-426614174000"
  expect(
    bookingAuthHeaders("{}", secret, id, "1760000000", nonce)[
      "X-Kvarteret-Signature"
    ],
  ).not.toBe(
    bookingAuthHeaders('{"changed":true}', secret, id, "1760000000", nonce)[
      "X-Kvarteret-Signature"
    ],
  )
})
