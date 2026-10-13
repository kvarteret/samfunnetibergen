import { createHmac } from "node:crypto"
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

function legacyToken() {
  const payload = Buffer.from(
    JSON.stringify({ receiptId, submissionId, expires: 1 }),
  ).toString("base64url")
  return `${payload}.${createHmac("sha256", secret).update(`booking-promotion-v1:${payload}`).digest("base64url")}`
}

test("promotion links remain valid over time and require their purpose-specific signature", () => {
  const token = signPromotionLink(receiptId, submissionId, secret)
  const now = Date.now()
  vi.spyOn(Date, "now").mockReturnValue(now + 100 * 365 * 24 * 60 * 60 * 1000)
  try {
    expect(verifyPromotionLink(token, secret)).toEqual({
      receiptId,
      submissionId,
    })
    expect(verifyPromotionLink(legacyToken(), secret)).toMatchObject({
      receiptId,
      submissionId,
    })
    expect(verifyPromotionLink(`${token}x`, secret)).toBeNull()
    expect(verifyPromotionLink(token, "other secret")).toBeNull()
    expect(
      verifyPromotionLink(
        signBookingReceipt(receiptId, submissionId, secret),
        secret,
      ),
    ).toBeNull()
  } finally {
    vi.restoreAllMocks()
  }
})

test("personalized link resolves to a non-page route without contact data", () => {
  vi.stubEnv("PERSONAL_SIGNING_SECRET", secret)
  vi.stubEnv("SITE_URL", "https://www.samfunnetibergen.no")
  const link = createBookingPromotionLink(receiptId, submissionId, "en")
  if (!link) throw new Error("Expected a promotion link")
  const url = new URL(link)
  expect(url.pathname).toBe("/api/booking/promotion")
  expect(url.searchParams.get("locale")).toBe("en")
  expect(
    verifyPromotionLink(url.searchParams.get("token") ?? "", secret),
  ).toMatchObject({ receiptId, submissionId })
  vi.stubEnv("PERSONAL_SIGNING_SECRET", "")
  expect(createBookingPromotionLink(receiptId, submissionId)).toBeNull()
})
