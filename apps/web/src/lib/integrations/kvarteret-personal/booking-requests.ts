import { createHash, createHmac, randomUUID } from "node:crypto"
import { z } from "zod"
import type { EventRequestBody } from "@/lib/integrations/crescat/types"

const PATH = "/api/v1/booking-requests"
const receiptSchema = z.object({
  booking_request_id: z.string().uuid(),
  submission_id: z.string().uuid(),
  content_hash: z.string().regex(/^[a-f0-9]{64}$/),
})
export type BookingSnapshot = {
  schema_version: 1
  submission_id: string
  kind: "room" | "karaoke"
  event_name: string
  contact_name: string
  contact_email: string
  room_ids: number[]
  schedule: { date: string; doors_open: string; doors_close: string }[]
  form: object
  crescat_payload: EventRequestBody
}
export function bookingAuthHeaders(
  body: string,
  secret: string,
  submissionId: string,
  timestamp = String(Math.floor(Date.now() / 1000)),
  nonce = randomUUID(),
) {
  const canonical = [
    "booking-v1",
    timestamp,
    nonce,
    submissionId,
    "POST",
    PATH,
    createHash("sha256").update(body).digest("hex"),
  ].join("\n")
  return {
    "Content-Type": "application/json",
    "X-Kvarteret-Timestamp": timestamp,
    "X-Kvarteret-Nonce": nonce,
    "X-Kvarteret-Idempotency-Key": submissionId,
    "X-Kvarteret-Signature": `v1=${createHmac("sha256", secret).update(canonical).digest("hex")}`,
  }
}
/** Fail closed: no Crescat call is allowed until Personal acknowledges commit. */
export async function storeBookingRequest(
  snapshot: BookingSnapshot,
): Promise<string> {
  const secret = process.env.VOLUNTEER_PROSPECT_HMAC_SECRET
  if (!secret || secret.length < 32)
    throw new Error("Booking storage is not configured")
  const baseUrl = new URL(
    process.env.PERSONAL_APP_BASE_URL?.trim() ||
      "https://personal.samfunnetibergen.no",
  )
  if (
    baseUrl.username ||
    baseUrl.password ||
    (baseUrl.protocol !== "https:" &&
      !(
        process.env.NODE_ENV !== "production" &&
        ["localhost", "127.0.0.1"].includes(baseUrl.hostname) &&
        baseUrl.protocol === "http:"
      ))
  )
    throw new Error("Invalid Personal API origin")
  const body = JSON.stringify(snapshot)
  if (Buffer.byteLength(body) > 256 * 1024)
    throw new Error("Booking snapshot too large")
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(new URL(PATH, baseUrl), {
        method: "POST",
        headers: bookingAuthHeaders(body, secret, snapshot.submission_id),
        body,
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      })
      if (!response.ok) {
        if (response.status >= 500 && attempt < 2) continue
        throw new Error("Booking storage failed")
      }
      const receipt = receiptSchema.parse(await response.json())
      if (receipt.submission_id !== snapshot.submission_id)
        throw new Error("Invalid booking receipt")
      return receipt.booking_request_id
    } catch (error) {
      if (
        attempt < 2 &&
        (error instanceof TypeError ||
          (error instanceof DOMException &&
            ["AbortError", "TimeoutError"].includes(error.name)))
      )
        continue
      throw new Error("Booking storage failed")
    }
  }
  throw new Error("Booking storage failed")
}
