import { createHmac, timingSafeEqual } from "node:crypto"
import { z } from "zod"
import { personalSigningSecret } from "@/lib/integrations/kvarteret-personal/signing-secret"
import { resolveSiteUrl } from "@/lib/site-url"

const DOMAIN = "booking-promotion-v1:"
const schema = z.object({
  receiptId: z.string().uuid(),
  submissionId: z.string().uuid(),
  // Previously issued links carry an expiry; retain their signed payload
  // compatibility while making both old and new promotion links permanent.
  expires: z.number().int().optional(),
})

export function signPromotionLink(
  receiptId: string,
  submissionId: string,
  secret: string,
) {
  const payload = Buffer.from(
    JSON.stringify({ receiptId, submissionId }),
  ).toString("base64url")
  return `${payload}.${createHmac("sha256", secret)
    .update(DOMAIN + payload)
    .digest("base64url")}`
}

export function verifyPromotionLink(token: string, secret: string) {
  try {
    if (token.length > 1024) return null
    const [payload, signature, extra] = token.split(".")
    if (!payload || !signature || extra) return null
    const expected = createHmac("sha256", secret)
      .update(DOMAIN + payload)
      .digest()
    const received = Buffer.from(signature, "base64url")
    if (
      received.length !== expected.length ||
      !timingSafeEqual(expected, received)
    )
      return null
    const receipt = schema.parse(
      JSON.parse(Buffer.from(payload, "base64url").toString()),
    )
    return receipt
  } catch {
    return null
  }
}

export function createBookingPromotionLink(
  receiptId: string,
  submissionId: string,
  locale = "nb",
) {
  const secret = personalSigningSecret()
  if (!secret) return null
  const url = new URL("/api/booking/promotion", resolveSiteUrl())
  url.searchParams.set(
    "token",
    signPromotionLink(receiptId, submissionId, secret),
  )
  url.searchParams.set("locale", locale === "en" ? "en" : "nb")
  return url.toString()
}
