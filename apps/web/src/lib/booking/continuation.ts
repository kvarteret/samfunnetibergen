import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
import { z } from "zod"
import {
  personalSigningSecret,
  personalVerificationSecrets,
} from "@/lib/integrations/kvarteret-personal/signing-secret"

const COOKIE = "booking-continuation"
const MAX_AGE = 60 * 60
const receiptSchema = z.object({
  receiptId: z.string().uuid(),
  submissionId: z.string().uuid(),
  expires: z.number(),
})

export function signBookingReceipt(
  receiptId: string,
  submissionId: string,
  secret: string,
  now = Date.now(),
) {
  const payload = Buffer.from(
    JSON.stringify({ receiptId, submissionId, expires: now + MAX_AGE * 1000 }),
  ).toString("base64url")
  return `${payload}.${createHmac("sha256", secret).update(`booking-continuation-v1:${payload}`).digest("base64url")}`
}

export function verifyBookingReceipt(
  value: string,
  secret: string,
  now = Date.now(),
) {
  try {
    const [payload, signature, extra] = value.split(".")
    if (!payload || !signature || extra) return null
    const expected = createHmac("sha256", secret)
      .update(`booking-continuation-v1:${payload}`)
      .digest()
    const received = Buffer.from(signature, "base64url")
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    )
      return null
    const receipt = receiptSchema.parse(
      JSON.parse(Buffer.from(payload, "base64url").toString()),
    )
    return receipt.expires > now ? receipt : null
  } catch {
    return null
  }
}

export async function setBookingContinuation(
  receiptId: string,
  submissionId: string,
) {
  const secret = personalSigningSecret()
  if (!secret) return
  ;(await cookies()).set(
    COOKIE,
    signBookingReceipt(receiptId, submissionId, secret),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    },
  )
}

export async function getBookingContinuation() {
  const value = (await cookies()).get(COOKIE)?.value
  if (!value) return null
  return (
    personalVerificationSecrets()
      .map(secret => verifyBookingReceipt(value, secret))
      .find(Boolean) ?? null
  )
}

export async function clearBookingContinuation() {
  ;(await cookies()).delete(COOKIE)
}
