import { describe, expect, it } from "vitest"

import type { BookingRoom } from "../types"
import { initialBookingState } from "./formState"
import { computePriceSummary } from "./pricing"

function room(overrides: Partial<BookingRoom>): BookingRoom {
  return {
    crescatRoomId: 0,
    title: "Rom",
    slug: "rom",
    summary: null,
    capacityStanding: null,
    capacitySeated: null,
    pricePerHour: null,
    openingHours: null,
    image: null,
    source: "sanity",
    floor: null,
    suitedPurposes: [],
    bar: null,
    hasSound: false,
    soundDetails: null,
    hasLighting: false,
    lightingDetails: null,
    hasAV: false,
    avDetails: null,
    ...overrides,
  }
}

const teglverket = room({
  crescatRoomId: 97,
  title: "Teglverket",
  pricePerHour: 1800,
})
const stillhet = room({
  crescatRoomId: 118,
  title: "Stillhet",
  pricePerHour: 300,
})
const tivoli = room({ crescatRoomId: 95, title: "Tivoli", pricePerHour: 1800 })

const booking = {
  ...initialBookingState,
  bookerType: "ekstern" as const,
  startDate: "2026-07-01",
  startTime: "19:00",
  endTime: "23:00",
}

describe("computePriceSummary", () => {
  it("charges room rent for external bookers based on hours selected", () => {
    const result = computePriceSummary(booking, [tivoli])
    expect(result.lines).toEqual([
      { label: "Tivoli (4 t × 1800 kr)", amount: 7200 },
    ])
    expect(result.subtotalExVat).toBe(7200)
    expect(result.vat).toBe(1800)
    expect(result.totalIncVat).toBe(9000)
  })

  it("does not charge room rent for internal bookers", () => {
    const result = computePriceSummary({ ...booking, bookerType: "intern" }, [
      tivoli,
    ])
    expect(result.lines).toEqual([])
    expect(result.subtotalExVat).toBe(0)
  })

  it("does not charge room rent for student organizations", () => {
    const result = computePriceSummary(
      { ...booking, bookerType: "studentorg" },
      [tivoli],
    )
    expect(result.lines).toEqual([])
  })

  it("skips Stillhet's price when bundled with Teglverket", () => {
    const result = computePriceSummary(booking, [teglverket, stillhet])
    expect(result.lines).toEqual([
      { label: "Teglverket (4 t × 1800 kr)", amount: 7200 },
    ])
  })

  it("still charges Stillhet on its own", () => {
    const result = computePriceSummary(booking, [stillhet])
    expect(result.lines).toEqual([
      { label: "Stillhet (4 t × 300 kr)", amount: 1200 },
    ])
  })

  it("adds technician, rigging, and bar service lines regardless of booker type", () => {
    const result = computePriceSummary(
      {
        ...booking,
        bookerType: "intern",
        soundTech: true,
        lightTech: true,
        riggingSetup: true,
        riggingTeardown: true,
        barKvarteret: true,
      },
      [],
    )
    expect(result.lines).toEqual([
      { label: "Lydtekniker", amount: 3500 },
      { label: "Lystekniker", amount: 3500 },
      { label: "Opprigg og oppsett av møblement", amount: 2000 },
      { label: "Nedrigg og rydding", amount: 2000 },
      { label: "Kvarteret står i bar", amount: 2000 },
    ])
    expect(result.subtotalExVat).toBe(13000)
    expect(result.vat).toBe(3250)
    expect(result.totalIncVat).toBe(16250)
  })

  it("returns no room rent lines when no date/time is selected", () => {
    const result = computePriceSummary({ ...booking, startDate: "" }, [tivoli])
    expect(result.lines).toEqual([])
  })
})
