import "server-only"
import { createHash, createHmac, randomUUID } from "node:crypto"
import {
  type ClickBatch,
  type InterestState,
  validBatchId,
  validClicks,
  validInterest,
} from "../domain/interest"

async function backendInterest(
  path: "read" | "response",
  body: {
    event_id: string
    source_hash: string | null
    clicks?: number
    batch_id?: string
  },
): Promise<InterestState> {
  const secret = process.env.EVENT_INTEREST_SECRET
  if (!secret || secret.length < 32)
    throw new Error("EVENT_INTEREST_SECRET is required")
  const base =
    process.env.PERSONAL_APP_BASE_URL?.trim() ||
    "https://personal.samfunnetibergen.no"
  const apiPath = `/api/v1/event-interest/${path}`
  const payload = JSON.stringify(body)
  const timestamp = String(Math.floor(Date.now() / 1000))
  const nonce = randomUUID()
  const canonical = [
    "event-interest-v1",
    timestamp,
    nonce,
    "POST",
    apiPath,
    createHash("sha256").update(payload).digest("hex"),
  ].join("\n")
  const signature = createHmac("sha256", secret).update(canonical).digest("hex")
  const response = await fetch(`${base}${apiPath}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Kvarteret-Timestamp": timestamp,
      "X-Kvarteret-Nonce": nonce,
      "X-Kvarteret-Signature": `v1=${signature}`,
    },
    body: payload,
    signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) throw new Error("Personal backend event response failed")
  const data = await response.json()
  if (!validInterest(data))
    throw new Error("Invalid event response from personal backend")
  return data
}

export function readInterest(eventId: string, source: string | null) {
  return backendInterest("read", { event_id: eventId, source_hash: source })
}

export function saveInterest(
  eventId: string,
  source: string,
  batch: ClickBatch,
) {
  if (!validClicks(batch.clicks) || !validBatchId(batch.batch_id))
    throw new Error("Invalid click batch")
  return backendInterest("response", {
    event_id: eventId,
    source_hash: source,
    ...batch,
  })
}
