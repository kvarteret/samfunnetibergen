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
  pricePerHour: 400,
})
const støy = room({
  crescatRoomId: 117,
  title: "Støy",
  pricePerHour: 400,
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

  it("charges the full elapsed duration when no bookable hours are configured", () => {
    const result = computePriceSummary(
      {
        ...booking,
        startDate: "2026-09-15",
        endDate: "2026-09-18",
        startTime: "19:00",
        endTime: "20:00",
      },
      [room({ title: "Maos Lille Røde", pricePerHour: 500 })],
    )

    expect(result.lines).toEqual([
      { label: "Maos Lille Røde (73 t × 500 kr)", amount: 36_500 },
    ])
    expect(result.totalIncVat).toBe(45_625)
  })

  it("bills every booked hour, regardless of the room's opening hours", () => {
    // Grøndahls-style room open 20:00–01:00; a 14:00–23:00 booking is 9 hours
    // of exclusive access, not just the 3 that overlap public opening hours.
    const result = computePriceSummary(
      {
        ...booking,
        startDate: "2026-10-12",
        startTime: "14:00",
        endTime: "23:00",
      },
      [
        room({
          title: "Grøndahls",
          pricePerHour: 1000,
          openingHours: {
            rows: [
              {
                weekdays: [1, 2, 3, 4],
                status: "open",
                duration: { start: "20:00", end: "01:00" },
              },
            ],
          },
        }),
      ],
    )

    expect(result.lines).toEqual([
      { label: "Grøndahls (9 t × 1000 kr)", amount: 9000 },
    ])
  })

  it("does not charge for nights or closed days inside a multi-day booking", () => {
    // House bookable Fri 12–03, Sat 14–03, Sun 16:30–22.
    const bookableHours = {
      rows: [
        {
          weekdays: [5],
          status: "open",
          duration: { start: "12:00", end: "03:00" },
        },
        {
          weekdays: [6],
          status: "open",
          duration: { start: "14:00", end: "03:00" },
        },
        {
          weekdays: [7],
          status: "open",
          duration: { start: "16:30", end: "22:00" },
        },
      ],
    }
    const multiDay = {
      ...booking,
      startDate: "2026-10-16",
      startTime: "19:00",
      endDate: "2026-10-18",
      endTime: "20:00",
    }
    const rooms = [room({ title: "Rom", pricePerHour: 1000 })]

    // Fri 19–03 (8) + Sat 14–03 (13) + Sun 16:30–20 (3.5) = 24.5, not 49.
    expect(computePriceSummary(multiDay, rooms, bookableHours).lines).toEqual([
      { label: "Rom (24.5 t × 1000 kr)", amount: 24_500 },
    ])
    // A closed Saturday is free as well: Fri 8 + Sun 3.5.
    expect(
      computePriceSummary(multiDay, rooms, bookableHours, [
        { date: "2026-10-17" },
      ]).lines,
    ).toEqual([{ label: "Rom (11.5 t × 1000 kr)", amount: 11_500 }])
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

  it("gives cheapest backstage room free when bundled with Teglverket", () => {
    const result = computePriceSummary(booking, [teglverket, stillhet])
    expect(result.lines).toEqual([
      { label: "Teglverket (4 t × 1800 kr)", amount: 7200 },
    ])
  })

  it("gives one backstage room free even when Støy is selected alone with Teglverket", () => {
    const result = computePriceSummary(booking, [teglverket, støy])
    expect(result.lines).toEqual([
      { label: "Teglverket (4 t × 1800 kr)", amount: 7200 },
    ])
  })

  it("charges second backstage room when both Stillhet and Støy selected with Teglverket", () => {
    const result = computePriceSummary(booking, [teglverket, stillhet, støy])
    expect(result.lines).toEqual([
      { label: "Teglverket (4 t × 1800 kr)", amount: 7200 },
      { label: "Støy (4 t × 400 kr)", amount: 1600 },
    ])
  })

  it("still charges Stillhet on its own", () => {
    const result = computePriceSummary(booking, [stillhet])
    expect(result.lines).toEqual([
      { label: "Stillhet (4 t × 400 kr)", amount: 1600 },
    ])
  })

  it("charges Støy normally when selected on its own", () => {
    const result = computePriceSummary(booking, [støy])
    expect(result.lines).toEqual([
      { label: "Støy (4 t × 400 kr)", amount: 1600 },
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
