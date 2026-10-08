import { afterEach, expect, test, vi } from "vitest"
import { signBookingReceipt } from "./continuation"
import {
  createBookingPromotionLink,
  signPromotionLink,
  verifyPromotionLink,
} from "./promotion-link"

const receiptId = "123e4567-e89b-42d3-a456-426614174001"
const submissionId = "123e4567-e89b-42d3-a456-426614174002"
const secret = "0123456789abcdef0123456789abcdef"

afterEach(() => vi.unstubAllEnvs())

test("promotion token is bound to booking IDs, signature and 90-day expiration", () => {
  const token = signPromotionLink(receiptId, submissionId, secret, 1000)
  expect(verifyPromotionLink(token, secret, 2000)).toMatchObject({
    receiptId,
    submissionId,
  })
  expect(verifyPromotionLink(`${token}x`, secret, 2000)).toBeNull()
  expect(verifyPromotionLink(token, "other secret", 2000)).toBeNull()
  expect(
    verifyPromotionLink(token, secret, 1000 + 90 * 24 * 60 * 60 * 1000),
  ).toBeNull()
  expect(
    verifyPromotionLink(
      signBookingReceipt(receiptId, submissionId, secret, 1000),
      secret,
      2000,
    ),
  ).toBeNull()
})

test("personalized link resolves to a non-page route without contact data", () => {
  vi.stubEnv("VOLUNTEER_PROSPECT_HMAC_SECRET", secret)
  vi.stubEnv("SITE_URL", "https://www.samfunnetibergen.no")
  const link = createBookingPromotionLink(receiptId, submissionId, "en")
  if (!link) throw new Error("Expected a promotion link")
  const url = new URL(link)
  expect(url.pathname).toBe("/api/booking/promotion")
  expect(url.searchParams.get("locale")).toBe("en")
  expect(
    verifyPromotionLink(url.searchParams.get("token") ?? "", secret),
  ).toMatchObject({ receiptId, submissionId })
  vi.stubEnv("VOLUNTEER_PROSPECT_HMAC_SECRET", "")
  expect(createBookingPromotionLink(receiptId, submissionId)).toBeNull()
})
