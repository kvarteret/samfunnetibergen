import { describe, expect, it } from "vitest"

import type { PublicOccurrence } from "../domain/events"
import { serializePublicOccurrence } from "./serializers"

function occurrence(dateKey: string, ticketUrl: string | null) {
  return {
    id: `occurrence:e1:${dateKey}`,
    dateKey,
    schedule: { startDate: "2026-11-01", startTime: null, endTime: null },
    event: {
      _id: "e1",
      slug: "pub hd",
      ticketUrl,
      dates: [
        { _key: "d1", startDate: "2026-11-01", ticketUrl },
        {
          _key: "d2",
          startDate: "2026-11-08",
          ticketUrl: "https://shop.example.test/second",
        },
      ],
    },
  } as unknown as PublicOccurrence
}

const options = { siteUrl: "https://site.example.test", locale: "nb" } as const

describe("serializePublicOccurrence ticket link", () => {
  it("uses the plain proxy URL when the date shares the event ticket URL", () => {
    const result = serializePublicOccurrence(
      occurrence("d1", "https://shop.example.test/first"),
      options,
    )
    expect(result.event.links.ticket).toBe(
      "https://site.example.test/api/tickets/pub%20hd?locale=nb",
    )
  })

  it("names the date when it has its own ticket URL", () => {
    const result = serializePublicOccurrence(
      occurrence("d2", "https://shop.example.test/first"),
      options,
    )
    expect(result.event.links.ticket).toBe(
      "https://site.example.test/api/tickets/pub%20hd?locale=nb&date=d2",
    )
  })

  it("is null without any ticket URL", () => {
    const result = serializePublicOccurrence(occurrence("d1", null), options)
    expect(result.event.links.ticket).toBeNull()
  })
})
