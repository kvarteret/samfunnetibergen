import { describe, expect, test } from "vitest"

import { buildKaraokeRequest } from "./karaoke"

describe("buildKaraokeRequest", () => {
  test("emits Antall personer (1439211) with numberOfPeople value", () => {
    const body = buildKaraokeRequest({
      eventName: "Test Karaoke",
      startDate: "2030-01-25",
      startTime: "21:00",
      durationHours: 2,
      description: "Test.",
      contactName: "Test",
      contactEmail: "test@ex.com",
      contactPhone: "000",
      numberOfPeople: 23,
      priceType: "ordinær",
    })

    const metaSection = body.sections.find(
      s => s.type === "metaData",
    )
    expect(metaSection).toBeDefined()
    if (metaSection && "fields" in metaSection.content) {
      const peopleField = metaSection.content.fields.find(
        (f: { id: number }) => f.id === 1439211,
      )
      expect(peopleField).toBeDefined()
      expect(peopleField!.value).toBe(23)
    }
  })

  test("roomBooking reserves Maos (room 98)", () => {
    const body = buildKaraokeRequest({
      eventName: "Test",
      startDate: "2030-01-25",
      startTime: "21:00",
      durationHours: 2,
      description: "",
      contactName: "Test",
      contactEmail: "test@ex.com",
      contactPhone: "",
      numberOfPeople: 10,
      priceType: "student",
    })

    const rb = body.sections.find(s => s.type === "roomBooking")
    expect(rb).toBeDefined()
    if (rb && "roomBookings" in (rb as { content: unknown }).content) {
      const content = (rb as { content: { roomBookings: Array<{ room_id: number }> } }).content
      expect(content.roomBookings).toHaveLength(1)
      expect(content.roomBookings[0].room_id).toBe(98)
    }
  })

  test("midnight-crossing end time advances date", () => {
    const body = buildKaraokeRequest({
      eventName: "Late Karaoke",
      startDate: "2030-01-25",
      startTime: "23:00",
      durationHours: 2,
      description: "",
      contactName: "Test",
      contactEmail: "test@ex.com",
      contactPhone: "",
      numberOfPeople: 10,
      priceType: "ordinær",
    })

    // 23:00 + 2h = 01:00 → end date should be 2030-01-26
    expect(body.start).toContain("2030-01-25 23:00")
    expect(body.end).toContain("2030-01-26 01:00")
  })
})
