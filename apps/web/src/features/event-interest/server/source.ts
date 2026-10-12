import "server-only"
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto"
import {
  personalSigningSecret,
  personalVerificationSecrets,
} from "@/lib/integrations/kvarteret-personal/signing-secret"
import { RETENTION_SECONDS } from "../domain/interest"

const DOMAIN = "event-interest-source-v1:"

function sign(secret: string, message: string) {
  return createHmac("sha256", secret).update(message).digest("hex")
}

function signature(eventId: string, token: string) {
  const secret = personalSigningSecret("EVENT_INTEREST_SECRET")
  if (!secret)
    throw new Error(
      "PERSONAL_SIGNING_SECRET must contain at least 32 characters",
    )
  return sign(secret, `${DOMAIN}${eventId}:${token}`)
}

/** Signatures the cookie may carry: current format, then the unprefixed
 * EVENT_INTEREST_SECRET format issued before the shared signing key. */
function acceptedSignatures(eventId: string, token: string) {
  const legacy = process.env.EVENT_INTEREST_SECRET
  return [
    ...personalVerificationSecrets("EVENT_INTEREST_SECRET").map(secret =>
      sign(secret, `${DOMAIN}${eventId}:${token}`),
    ),
    ...(legacy && legacy.length >= 32
      ? [sign(legacy, `${eventId}:${token}`)]
      : []),
  ]
}

export function sourceCookieName(eventId: string) {
  return `event-interest-${createHash("sha256").update(eventId).digest("hex").slice(0, 16)}`
}

export function createSourceCookie(eventId: string, now = Date.now()) {
  const token = `${randomBytes(16).toString("hex")}.${Math.floor(now / 1000)}`
  return `${token}.${signature(eventId, token)}`
}

export function sourceHash(
  eventId: string,
  cookie: string | undefined,
  now = Date.now(),
): string | null {
  if (!cookie || !/^[a-f0-9]{32}\.\d{10}\.[a-f0-9]{64}$/.test(cookie))
    return null
  const [random, issued, signed] = cookie.split(".")
  const age = Math.floor(now / 1000) - Number(issued)
  if (age < 0 || age >= RETENTION_SECONDS) return null
  const received = Buffer.from(signed, "hex")
  const valid = acceptedSignatures(eventId, `${random}.${issued}`).some(
    expected => timingSafeEqual(received, Buffer.from(expected, "hex")),
  )
  return valid ? signed : null
}
