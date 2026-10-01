import "server-only"
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto"
import { RETENTION_SECONDS } from "../domain/interest"

function secret() {
  const value = process.env.EVENT_INTEREST_SECRET
  if (!value || value.length < 32)
    throw new Error("EVENT_INTEREST_SECRET must contain at least 32 characters")
  return value
}

function signature(eventId: string, token: string) {
  return createHmac("sha256", secret())
    .update(`${eventId}:${token}`)
    .digest("hex")
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
  const expected = signature(eventId, `${random}.${issued}`)
  if (
    !timingSafeEqual(Buffer.from(signed, "hex"), Buffer.from(expected, "hex"))
  )
    return null
  return signed
}
