import { describe, expect, test } from "vitest"

import {
  buildExternalBooking,
  buildInternalBooking,
  buildRoomBooking,
  type RoomBookingInput,
} from "./room-booking"

// ── Shared input fixture ────────────────────────────────────────────────────

const BASE_INPUT: RoomBookingInput = {
  eventName: "Testarrangement",
  roomId: 95,
  roomIds: [],
  startDate: "2026-12-24",
  startTime: "20:00",
  endTime: "23:00",
  description: "En testbooking for å verifisere integrasjonen.",
  audienceCount: 50,
  openOrClosed: "Åpent",
  furniture: "Bord og stoler",
  techEquipment: "Projektor + lerret",
  cateringWishes: "Enkel bevertning",
  freeOrPaid: "Gratis",
  ticketTypes: "",
  contactName: "Test Testesen",
  contactEmail: "test@example.com",
  contactPhone: "+4740612345",
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function metaFieldById(
  body: ReturnType<typeof buildExternalBooking>,
  fieldId: number,
) {
  for (const sec of body.sections) {
    if (sec.type !== "metaData" || !("fields" in sec.content)) continue
    for (const f of sec.content.fields) {
      if (f.id === fieldId) return f
    }
  }
  return undefined
}

function sectionOfType(
  body: ReturnType<typeof buildExternalBooking>,
  type: string,
) {
  return body.sections.find(s => s.type === type)
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("buildExternalBooking", () => {
  test("emits NEEDS_AMPHI (80461) in Bestilling section", () => {
    const body = buildExternalBooking({
      ...BASE_INPUT,
      needsAmphi: true,
    })
    const field = metaFieldById(body, 80461)
    expect(field).toBeDefined()
    expect(field!.value).toBe(true)
  })

  test("emits NEEDS_AMPHI when not set (defaults false)", () => {
    const body = buildExternalBooking(BASE_INPUT)
    const field = metaFieldById(body, 80461)
    expect(field).toBeDefined()
    expect(field!.value).toBe(false)
  })

  test("renames catering section to Mat og drikke", () => {
    const body = buildExternalBooking(BASE_INPUT)
    const catering = body.sections.find(
      s =>
        s.type === "metaData" &&
        "parent_id" in s.content &&
        s.content.parent_id === 11068,
    )
    expect(catering).toBeDefined()
    expect(catering!.title).toBe("Mat og drikke")
  })

  test("emits BAR_SELF (4365154) and BAR_KVARTERET (4382234) in catering", () => {
    const body = buildExternalBooking({
      ...BASE_INPUT,
      barSelf: true,
      barKvarteret: true,
    })
    expect(metaFieldById(body, 4365154)?.value).toBe(true)
    expect(metaFieldById(body, 4382234)?.value).toBe(true)
  })

  test("emits alternativeDates content when provided", () => {
    const body = buildExternalBooking({
      ...BASE_INPUT,
      alternativeDates: ["2026-12-25", "2026-12-26"],
    })
    const alt = sectionOfType(body, "alternativeDates")
    expect(alt).toBeDefined()
    if (alt && "content" in alt) {
      expect(alt.content).toEqual(["2026-12-25", "2026-12-26"])
    }
  })

  test("emits empty alternativeDates when not provided", () => {
    const body = buildExternalBooking(BASE_INPUT)
    const alt = sectionOfType(body, "alternativeDates")
    expect(alt).toBeDefined()
    if (alt && "content" in alt) {
      expect(alt.content).toEqual([])
    }
  })

  test("skips flexible-dates note when alternativeDates are provided", () => {
    const body = buildExternalBooking({
      ...BASE_INPUT,
      flexibleDates: true,
      alternativeDates: ["2026-12-25"],
    })
    expect(body.description).toBe(BASE_INPUT.description)
    // No "Fleksibel på dato og rom" appended.
    expect(body.description).not.toContain("Fleksibel")
  })

  test("prepends flexible-dates note before the description when no alternativeDates", () => {
    const body = buildExternalBooking({
      ...BASE_INPUT,
      flexibleDates: true,
    })
    expect(body.description).toBe(
      `Dato og rom er fleksibelt. Kvarteret kan foreslå et annet tidspunkt eller rom hvis dette passer bedre.\n\n${BASE_INPUT.description.trim()}`,
    )
  })

  test("ekstern: 'house' sales method toggles Kvarteret's terminal on", () => {
    const body = buildExternalBooking({
      ...BASE_INPUT,
      freeOrPaid: "Betalt",
      ticketSalesMethod: "house",
    })
    expect(metaFieldById(body, 3511840)?.value).toBe(true)
    expect(metaFieldById(body, 4451407)?.value).toBe(false)
  })

  test("ekstern: 'ownTerminal' sales method toggles own terminal on", () => {
    const body = buildExternalBooking({
      ...BASE_INPUT,
      freeOrPaid: "Betalt",
      ticketSalesMethod: "ownTerminal",
    })
    expect(metaFieldById(body, 3511840)?.value).toBe(false)
    expect(metaFieldById(body, 4451407)?.value).toBe(true)
  })

  test("intern: 'ownTerminal' maps to the 'eget billettsystem' toggle", () => {
    const body = buildInternalBooking({
      ...BASE_INPUT,
      freeOrPaid: "Betalt",
      ticketSalesMethod: "ownTerminal",
    })
    const own = metaFieldById(body, 4451407)
    expect(own?.value).toBe(true)
    expect(own?.title).toBe("Vi bruker eget billettsystem")
  })

  test("free events leave both payment toggles off", () => {
    const body = buildExternalBooking(BASE_INPUT)
    expect(metaFieldById(body, 3511840)?.value).toBe(false)
    expect(metaFieldById(body, 4451407)?.value).toBe(false)
  })

  test("single room produces one roomBooking entry", () => {
    const body = buildExternalBooking(BASE_INPUT)
    const rb = sectionOfType(body, "roomBooking")
    expect(rb).toBeDefined()
    if (
      rb &&
      "roomBookings" in (rb as { content: Record<string, unknown> }).content
    ) {
      const content = (
        rb as { content: { roomBookings: Array<{ room_id: number }> } }
      ).content
      expect(content.roomBookings).toHaveLength(1)
      expect(content.roomBookings[0].room_id).toBe(95)
    }
  })

  test("multi-room produces multiple roomBooking entries", () => {
    const body = buildExternalBooking({
      ...BASE_INPUT,
      roomIds: [95, 97, 117],
    })
    const rb = sectionOfType(body, "roomBooking")
    if (
      rb &&
      "roomBookings" in (rb as { content: Record<string, unknown> }).content
    ) {
      const content = (
        rb as { content: { roomBookings: Array<{ room_id: number }> } }
      ).content
      expect(content.roomBookings).toHaveLength(3)
      expect(content.roomBookings.map(b => b.room_id)).toEqual([95, 97, 117])
    }
  })
})

describe("buildInternalBooking", () => {
  test("emits NEEDS_AMPHI (80461) in Bestilling", () => {
    const body = buildInternalBooking({
      ...BASE_INPUT,
      needsAmphi: true,
    })
    const field = metaFieldById(
      body as unknown as ReturnType<typeof buildExternalBooking>,
      80461,
    )
    expect(field).toBeDefined()
    expect(field!.value).toBe(true)
  })

  test("keyContacts uses explicit list when provided", () => {
    const body = buildInternalBooking({
      ...BASE_INPUT,
      keyContacts: [
        {
          name: "Alice",
          role: "Lyd",
          email: "alice@ex.com",
          phone: "+4740612345",
          country_code: "+47",
        },
        {
          name: "Bob",
          role: "Lys",
          email: "bob@ex.com",
          phone: "+447400123456",
          country_code: "+44",
        },
      ],
    })
    const kc = body.sections.find(s => s.type === "keyContacts")
    expect(kc).toBeDefined()
    if (kc && "content" in kc) {
      const contacts = kc.content as Array<{
        name: string
        role: string
        phone: string
        country_code: string
      }>
      expect(contacts).toHaveLength(2)
      expect(contacts[0].name).toBe("Alice")
      expect(contacts[0].role).toBe("Lyd")
      expect(contacts[0].phone).toBe("40612345")
      expect(contacts[0].country_code).toBe("+47")
      expect(contacts[1].name).toBe("Bob")
      expect(contacts[1].phone).toBe("7400123456")
      expect(contacts[1].country_code).toBe("+44")
    }
  })

  test("keyContacts fallback uses contactRole for role", () => {
    const body = buildInternalBooking({
      ...BASE_INPUT,
      contactRole: "Arrangør",
    })
    const kc = body.sections.find(s => s.type === "keyContacts")
    if (kc && "content" in kc) {
      const contacts = kc.content as Array<{ name: string; role: string }>
      expect(contacts).toHaveLength(1)
      expect(contacts[0].role).toBe("Arrangør")
    }
  })

  test("intern catering has no bar toggles", () => {
    const body = buildInternalBooking({
      ...BASE_INPUT,
      barSelf: true,
      barKvarteret: true,
    })
    const catering = body.sections.find(
      s =>
        s.type === "metaData" &&
        "parent_id" in s.content &&
        s.content.parent_id === 11068,
    )
    expect(catering).toBeDefined()
    if (catering && catering.content && "fields" in catering.content) {
      const ids = catering.content.fields.map((f: { id: number }) => f.id)
      expect(ids).not.toContain(4365154)
      expect(ids).not.toContain(4382234)
    }
  })

  test("recurringDates section emits provided dates", () => {
    const body = buildInternalBooking({
      ...BASE_INPUT,
      recurringDates: ["2030-01-21", "2030-01-28"],
    })
    const rd = body.sections.find(s => s.type === "recurringDates")
    expect(rd).toBeDefined()
    if (rd && "content" in rd) {
      expect(rd.content).toEqual(["2030-01-21", "2030-01-28"])
    }
  })

  test("recurringDates defaults to null when not set", () => {
    const body = buildInternalBooking(BASE_INPUT)
    const rd = body.sections.find(s => s.type === "recurringDates")
    expect(rd).toBeDefined()
    if (rd && "content" in rd) {
      expect(rd.content).toBeNull()
    }
  })
})

describe("buildRoomBooking", () => {
  test("ekstern uses external builder", () => {
    const body = buildRoomBooking("ekstern", BASE_INPUT)
    // External builder has "Mat og drikke" section
    const catering = body.sections.find(
      s =>
        s.type === "metaData" &&
        "parent_id" in s.content &&
        s.content.parent_id === 11068,
    )
    expect(catering?.title).toBe("Mat og drikke")
  })

  test("intern uses internal builder", () => {
    const body = buildRoomBooking("intern", BASE_INPUT)
    const recurring = body.sections.find(s => s.type === "recurringDates")
    expect(recurring).toBeDefined()
  })
})

describe("doorsAssignments (via buildExternalBooking)", () => {
  const assignmentsContent = (
    body: ReturnType<typeof buildExternalBooking>,
  ) => {
    const sec = body.sections.find(s => s.type === "assignments")
    return sec && "content" in sec ? (sec.content as Array<unknown>) : []
  }

  test("single day with doors time emits one Doors entry", () => {
    const body = buildExternalBooking({
      ...BASE_INPUT,
      doorsTimes: ["19:30"],
    })
    const assignments = assignmentsContent(body)
    expect(assignments).toHaveLength(1)
    expect(assignments[0]).toMatchObject({
      title: "Doors",
      description: null,
    })
    const a0 = assignments[0] as { start: string; end: string }
    expect(a0.start).toBe(a0.end)
    expect(a0.start).toContain("19:30")
  })

  test("single day without doors time emits empty assignments", () => {
    const body = buildExternalBooking(BASE_INPUT)
    expect(assignmentsContent(body)).toEqual([])
  })

  test("doorsTimes array with empty strings produces empty assignments", () => {
    const body = buildExternalBooking({
      ...BASE_INPUT,
      doorsTimes: ["", "", ""],
    })
    expect(assignmentsContent(body)).toEqual([])
  })

  test("multi-day: one doors entry per non-empty day, labelled dag N", () => {
    const body = buildExternalBooking({
      ...BASE_INPUT,
      startDate: "2026-12-24",
      endDate: "2026-12-26",
      doorsTimes: ["19:30", "", "20:00"],
    })
    const assignments = assignmentsContent(body)
    expect(assignments).toHaveLength(2)

    expect(assignments[0]).toMatchObject({ title: "Doors dag 1" })
    const a0 = assignments[0] as { start: string }
    expect(a0.start).toContain("2026-12-24")
    expect(a0.start).toContain("19:30")

    expect(assignments[1]).toMatchObject({ title: "Doors dag 3" })
    const a1 = assignments[1] as { start: string }
    expect(a1.start).toContain("2026-12-26")
    expect(a1.start).toContain("20:00")
  })

  test("multi-day: all days filled with same time", () => {
    const body = buildExternalBooking({
      ...BASE_INPUT,
      startDate: "2026-12-24",
      endDate: "2026-12-26",
      doorsTimes: ["19:00", "19:00", "19:00"],
    })
    const assignments = assignmentsContent(body)
    expect(assignments).toHaveLength(3)
    expect(assignments[0]).toMatchObject({ title: "Doors dag 1" })
    expect(assignments[1]).toMatchObject({ title: "Doors dag 2" })
    expect(assignments[2]).toMatchObject({ title: "Doors dag 3" })
  })
})
