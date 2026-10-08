import { afterEach, expect, test, vi } from "vitest"
import { setBookingContinuation } from "@/lib/booking/continuation"
import { signPromotionLink } from "@/lib/booking/promotion-link"
import { GET } from "./route"

vi.mock("@/lib/booking/continuation", () => ({
  setBookingContinuation: vi.fn(),
}))
afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})
const secret = "0123456789abcdef0123456789abcdef"
const receiptId = "123e4567-e89b-42d3-a456-426614174001"
const submissionId = "123e4567-e89b-42d3-a456-426614174002"

test("redeems a link in a new browser and redirects without exposing token", async () => {
  vi.stubEnv("VOLUNTEER_PROSPECT_HMAC_SECRET", secret)
  const token = signPromotionLink(receiptId, submissionId, secret)
  const response = await GET(
    new Request(
      `https://www.samfunnetibergen.no/api/booking/promotion?locale=en&token=${token}`,
    ),
  )
  expect(response.status).toBe(303)
  expect(response.headers.get("location")).toBe(
    "https://www.samfunnetibergen.no/en/arrangementer/ny?fromBooking=1",
  )
  expect(response.headers.get("cache-control")).toBe("no-store")
  expect(response.headers.get("referrer-policy")).toBe("no-referrer")
  expect(setBookingContinuation).toHaveBeenCalledWith(receiptId, submissionId)
})

test("rejects expired or forged links without changing the current booking", async () => {
  vi.stubEnv("VOLUNTEER_PROSPECT_HMAC_SECRET", secret)
  for (const token of [
    "forged",
    signPromotionLink(receiptId, submissionId, secret, 0),
  ]) {
    const response = await GET(
      new Request(
        `https://www.samfunnetibergen.no/api/booking/promotion?token=${token}`,
      ),
    )
    expect(response.status).toBe(400)
    expect(await response.text()).toContain("Promoteringslenken er ugyldig")
  }
  expect(setBookingContinuation).not.toHaveBeenCalled()
})
