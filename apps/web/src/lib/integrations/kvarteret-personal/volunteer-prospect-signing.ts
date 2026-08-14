import { createHash, createHmac, randomUUID } from "node:crypto"

export const VOLUNTEER_PROSPECT_PATH = "/api/v1/volunteer-prospects"

export type VolunteerProspectSigningOptions = {
  timestamp?: string
  nonce?: string
}

export function buildVolunteerProspectSignature(
  body: string,
  secret: string,
  options: Required<VolunteerProspectSigningOptions>,
): string {
  const bodyDigest = createHash("sha256").update(body, "utf8").digest("hex")
  const canonicalMessage = [
    "v1",
    options.timestamp,
    options.nonce,
    "POST",
    VOLUNTEER_PROSPECT_PATH,
    bodyDigest,
  ].join("\n")
  const signature = createHmac("sha256", secret)
    .update(canonicalMessage, "utf8")
    .digest("hex")
  return `v1=${signature}`
}

export function createVolunteerProspectAuthHeaders(
  body: string,
  secret: string | undefined,
  options: VolunteerProspectSigningOptions = {},
): Record<string, string> {
  const normalizedSecret = secret?.trim()
  if (!normalizedSecret || normalizedSecret.length < 32) {
    throw new Error(
      "VOLUNTEER_PROSPECT_HMAC_SECRET must contain at least 32 characters.",
    )
  }
  const timestamp =
    options.timestamp ?? Math.floor(Date.now() / 1_000).toString()
  const nonce = options.nonce ?? randomUUID()
  return {
    "X-Kvarteret-Timestamp": timestamp,
    "X-Kvarteret-Nonce": nonce,
    "X-Kvarteret-Signature": buildVolunteerProspectSignature(
      body,
      normalizedSecret,
      { timestamp, nonce },
    ),
  }
}
