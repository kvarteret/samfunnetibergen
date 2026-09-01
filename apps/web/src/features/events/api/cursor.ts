import { z } from "zod"
import type { PublicOccurrence } from "../domain/public-events"
import { publicDateSchema, publicLocaleSchema } from "./schemas"

const cursorOrderingKeySchema = z
  .object({
    startDate: publicDateSchema,
    startTime: z.string().nullable(),
    eventId: z.string().min(1),
    dateKey: z.string().min(1),
  })
  .strict()

const cursorPayloadSchema = z
  .object({
    version: z.literal(1),
    issuedAt: z.number().int().positive(),
    locale: publicLocaleSchema,
    from: publicDateSchema,
    to: publicDateSchema.nullable(),
    includeInternal: z.boolean(),
    last: cursorOrderingKeySchema,
  })
  .strict()

export type PublicEventsCursor = z.infer<typeof cursorPayloadSchema>

export type PublicEventsCursorContext = Pick<
  PublicEventsCursor,
  "locale" | "from" | "to" | "includeInternal"
>

const CURSOR_MAX_AGE_MS = 24 * 60 * 60 * 1_000
const CURSOR_CLOCK_SKEW_MS = 5 * 60 * 1_000

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url")
}

function decodeBase64Url(value: string): string | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null

  const decoded = Buffer.from(value, "base64url")
  if (decoded.toString("base64url") !== value) return null
  return decoded.toString("utf8")
}

function sameCursorContext(
  cursor: PublicEventsCursor,
  expected: PublicEventsCursorContext,
): boolean {
  return (
    cursor.locale === expected.locale &&
    cursor.from === expected.from &&
    cursor.to === expected.to &&
    cursor.includeInternal === expected.includeInternal
  )
}

export function encodePublicEventsCursor(
  occurrence: PublicOccurrence,
  context: PublicEventsCursorContext,
  issuedAt = Date.now(),
): string {
  return encodeBase64Url(
    JSON.stringify({
      version: 1,
      issuedAt,
      ...context,
      last: {
        startDate: occurrence.schedule.startDate,
        startTime: occurrence.schedule.startTime,
        eventId: occurrence.event._id,
        dateKey: occurrence.dateKey,
      },
    } satisfies PublicEventsCursor),
  )
}

export function decodePublicEventsCursor(
  value: string,
  expected: PublicEventsCursorContext,
  now = Date.now(),
): PublicEventsCursor | null {
  const decoded = decodeBase64Url(value)
  if (!decoded) return null

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(decoded)
  } catch {
    return null
  }

  const parsed = cursorPayloadSchema.safeParse(parsedJson)
  if (!parsed.success || !sameCursorContext(parsed.data, expected)) return null
  if (
    parsed.data.issuedAt < now - CURSOR_MAX_AGE_MS ||
    parsed.data.issuedAt > now + CURSOR_CLOCK_SKEW_MS
  ) {
    return null
  }

  return parsed.data
}
