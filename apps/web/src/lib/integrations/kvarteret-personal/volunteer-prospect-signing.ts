import { createHash, createHmac, randomUUID } from "node:crypto"
import { isIP } from "node:net"
import { getPostHogDistinctIdFromCookie } from "@/lib/posthog/distinct-id"

export const VOLUNTEER_PROSPECT_PATH = "/api/v1/volunteer-prospects"

const CANONICAL_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const CLIENT_KEY_PATTERN = /^v1=[0-9a-f]{64}$/

export type VolunteerProspectSigningOptions = {
  idempotencyKey: string
  clientKey: string
  timestamp?: string
  nonce?: string
}

type VolunteerProspectCanonicalSigningOptions =
  Required<VolunteerProspectSigningOptions>

export function buildVolunteerProspectSignature(
  body: string,
  secret: string,
  options: VolunteerProspectCanonicalSigningOptions,
): string {
  const bodyDigest = createHash("sha256").update(body, "utf8").digest("hex")
  const canonicalMessage = [
    "v2",
    options.timestamp,
    options.nonce,
    options.idempotencyKey,
    options.clientKey,
    "POST",
    VOLUNTEER_PROSPECT_PATH,
    bodyDigest,
  ].join("\n")
  const signature = createHmac("sha256", secret)
    .update(canonicalMessage, "utf8")
    .digest("hex")
  return `v2=${signature}`
}

export function createVolunteerProspectAuthHeaders(
  body: string,
  secret: string | undefined,
  options: VolunteerProspectSigningOptions,
): Record<string, string> {
  const normalizedSecret = requireSecret(
    secret,
    "VOLUNTEER_PROSPECT_HMAC_SECRET",
  )
  if (!CANONICAL_UUID_PATTERN.test(options.idempotencyKey)) {
    throw new Error(
      "Volunteer prospect idempotency key must be a canonical UUID.",
    )
  }
  if (!CLIENT_KEY_PATTERN.test(options.clientKey)) {
    throw new Error(
      "Volunteer prospect client key must use the v1 HMAC format.",
    )
  }
  const timestamp =
    options.timestamp ?? Math.floor(Date.now() / 1_000).toString()
  const nonce = options.nonce ?? randomUUID()
  if (!/^\d+$/.test(timestamp) || !CANONICAL_UUID_PATTERN.test(nonce)) {
    throw new Error("Volunteer prospect signing metadata is invalid.")
  }
  return {
    "X-Kvarteret-Timestamp": timestamp,
    "X-Kvarteret-Nonce": nonce,
    "X-Kvarteret-Idempotency-Key": options.idempotencyKey,
    "X-Kvarteret-Client-Key": options.clientKey,
    "X-Kvarteret-Signature": buildVolunteerProspectSignature(
      body,
      normalizedSecret,
      {
        timestamp,
        nonce,
        idempotencyKey: options.idempotencyKey,
        clientKey: options.clientKey,
      },
    ),
  }
}

export function resolveVolunteerProspectIdempotencyKey(
  suppliedValue: string | null,
): string {
  if (suppliedValue === null) return randomUUID()
  if (!CANONICAL_UUID_PATTERN.test(suppliedValue)) {
    throw new Error(
      "Volunteer prospect idempotency key must be a canonical UUID.",
    )
  }
  return suppliedValue
}

export function createVolunteerProspectClientKey(
  headers: Headers,
  secret: string | undefined,
): string {
  const normalizedSecret = requireSecret(
    secret,
    "VOLUNTEER_PROSPECT_CLIENT_KEY_SECRET",
  )
  const visitorId = getPostHogDistinctIdFromCookie(
    headers.get("cookie") ?? undefined,
  )
  const forwardedFor =
    headers.get("x-vercel-forwarded-for") ?? headers.get("x-forwarded-for")
  const canonicalClientIp = forwardedFor?.split(",", 1)[0]?.trim().toLowerCase()
  const userAgent = headers.get("user-agent")?.trim()

  let clientIdentity: string
  if (visitorId) {
    clientIdentity = `visitor:${visitorId}`
  } else {
    if (!canonicalClientIp || isIP(canonicalClientIp) === 0) {
      throw new Error("A trusted client IP header is required.")
    }
    clientIdentity = userAgent
      ? `ip:${canonicalClientIp}\nuser-agent:${userAgent.slice(0, 512)}`
      : `ip:${canonicalClientIp}`
  }
  const digest = createHmac("sha256", normalizedSecret)
    .update(clientIdentity, "utf8")
    .digest("hex")
  return `v1=${digest}`
}

function requireSecret(secret: string | undefined, name: string): string {
  const normalizedSecret = secret?.trim()
  if (!normalizedSecret || normalizedSecret.length < 32) {
    throw new Error(`${name} must contain at least 32 characters.`)
  }
  return normalizedSecret
}
