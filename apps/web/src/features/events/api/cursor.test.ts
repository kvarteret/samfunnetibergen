import { describe, expect, it } from "vitest"
import {
  type PublicOccurrence,
  resolvePublicEvent,
} from "../domain/public-events"
import { decodePublicEventsCursor, encodePublicEventsCursor } from "./cursor"

const occurrence: PublicOccurrence = {
  id: "occurrence:event-1:date-1",
  dateKey: "date-1",
  event: resolvePublicEvent({
    _id: "event-1",
    eventKind: "single",
    eventStatus: "scheduled",
    slug: "event-1",
    dates: [
      {
        _key: "date-1",
        startDate: "2026-09-10",
        startTime: "18:00",
        endTime: "20:00",
      },
    ],
  }),
  schedule: {
    startDate: "2026-09-10",
    startTime: "18:00",
    endDate: "2026-09-10",
    endTime: "20:00",
    startsAt: "2026-09-10T16:00:00.000Z",
    endsAt: "2026-09-10T18:00:00.000Z",
    timeZone: "Europe/Oslo",
  },
}

const context = {
  locale: "nb" as const,
  from: "2026-09-01",
  to: "2026-12-31",
  includeInternal: false,
}

describe("public events cursors", () => {
  it("round-trips the ordering key and request fingerprint", () => {
    const cursor = encodePublicEventsCursor(occurrence, context, 1_000)

    expect(decodePublicEventsCursor(cursor, context, 1_000)).toMatchObject({
      version: 1,
      issuedAt: 1_000,
      last: {
        startDate: "2026-09-10",
        startTime: "18:00",
        eventId: "event-1",
        dateKey: "date-1",
      },
    })
  })

  it("rejects a cursor when parameters or age do not match", () => {
    const cursor = encodePublicEventsCursor(occurrence, context, 1_000)

    expect(
      decodePublicEventsCursor(cursor, { ...context, locale: "en" }, 1_000),
    ).toBeNull()
    expect(
      decodePublicEventsCursor(
        cursor,
        context,
        1_000 + 24 * 60 * 60 * 1_000 + 1,
      ),
    ).toBeNull()
  })

  it("rejects malformed base64url and JSON", () => {
    expect(decodePublicEventsCursor("not valid", context, 1_000)).toBeNull()
    expect(decodePublicEventsCursor("e30", context, 1_000)).toBeNull()
  })
})
