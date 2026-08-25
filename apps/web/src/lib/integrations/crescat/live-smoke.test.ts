/**
 * Live smoke test — submits real bookings to Crescat.
 *
 * SKIPPED unless CRESCAT_LIVE_TEST=1 is set. Never runs in CI.
 * Bypasses server-action opening-hours/conflict checks (which need
 * RSC runtime) and tests the core builders + CSRF handshake directly.
 * Sets as many fields as possible per form to exercise full payload shapes.
 *
 * Usage:
 *   CRESCAT_LIVE_TEST=1 npx vitest run src/lib/integrations/crescat/live-smoke.test.ts
 */

import { describe, expect, test } from "vitest"
import { postEventRequest } from "./client"
import { buildKaraokeRequest, KARAOKE_SLUG } from "./karaoke"
import {
  buildExternalBooking,
  buildInternalBooking,
  ROOM_BOOKING_SLUGS,
} from "./room-booking"

const LIVE = process.env.CRESCAT_LIVE_TEST === "1"

describe.skipIf(!LIVE)("live smoke test — real Crescat submissions", () => {
  test("midnight regression — external doors before midnight", async () => {
    const body = buildExternalBooking({
      eventName: "[SLETT MEG] PR109 | Dører før midnatt | E-tjenesten",
      roomId: 95,
      roomIds: [95],
      startDate: "2030-02-01",
      startTime: "23:30",
      endTime: "00:30",
      doorsTimes: ["23:45"],
      estimatedEndTimes: ["00:20"],
      description:
        "Live regresjonstest for lokal tid og dato ved booking over midnatt.",
      audienceCount: 10,
      openOrClosed: "Lukket",
      furniture: "Ingen spesielle behov",
      techEquipment: "Ingen",
      cateringWishes: "Nei",
      freeOrPaid: "Gratis",
      ticketTypes: "",
      contactName: "E-Tjenesten",
      contactEmail: "e@samfunnetibergen.no",
      contactPhone: "+4740612345",
      invoiceAddress: "Testbooking — skal slettes",
    })

    expect(body.start).toBe("2030-02-01 23:30:00")
    expect(body.end).toBe("2030-02-02 00:30:00")
    const assignments = body.sections.find(
      section => section.type === "assignments",
    )
    expect(assignments?.content).toContainEqual({
      title: "Doors",
      description: null,
      start: "2030-02-01 23:45:00",
      end: "2030-02-01 23:45:00",
    })
    expect(assignments?.content).toContainEqual({
      title: "Antatt slutt",
      description: null,
      start: "2030-02-02 00:20:00",
      end: "2030-02-02 00:20:00",
    })

    const result = await postEventRequest(ROOM_BOOKING_SLUGS.ekstern, body)
    expect(
      result.ok,
      result.ok
        ? undefined
        : `POST failed: ${(result as { error: string }).error}`,
    ).toBe(true)
    if (result.ok) expect(result.value).toBe(201)
  }, 30_000)

  test("midnight regression — internal doors after midnight", async () => {
    const body = buildInternalBooking({
      eventName: "[SLETT MEG] PR109 | Dører etter midnatt | E-tjenesten",
      roomId: 95,
      roomIds: [95],
      startDate: "2030-02-02",
      startTime: "23:30",
      endTime: "00:30",
      doorsTimes: ["00:15"],
      estimatedEndTimes: ["00:20"],
      description:
        "Live regresjonstest for lokal tid og dato ved booking over midnatt.",
      audienceCount: 10,
      openOrClosed: "Lukket",
      furniture: "Ingen spesielle behov",
      techEquipment: "Ingen",
      cateringWishes: "Nei",
      freeOrPaid: "Gratis",
      ticketTypes: "",
      contactName: "E-Tjenesten",
      contactEmail: "e@samfunnetibergen.no",
      contactPhone: "+4740612345",
    })

    expect(body.start).toBe("2030-02-02 23:30:00")
    expect(body.end).toBe("2030-02-03 00:30:00")
    const assignments = body.sections.find(
      section => section.type === "assignments",
    )
    expect(assignments?.content).toContainEqual({
      title: "Doors",
      description: null,
      start: "2030-02-03 00:15:00",
      end: "2030-02-03 00:15:00",
    })
    expect(assignments?.content).toContainEqual({
      title: "Antatt slutt",
      description: null,
      start: "2030-02-03 00:20:00",
      end: "2030-02-03 00:20:00",
    })

    const result = await postEventRequest(ROOM_BOOKING_SLUGS.intern, body)
    expect(
      result.ok,
      result.ok
        ? undefined
        : `POST failed: ${(result as { error: string }).error}`,
    ).toBe(true)
    if (result.ok) expect(result.value).toBe(201)
  }, 30_000)

  test("external (standard) form — all fields, HTTP 201", async () => {
    const body = buildExternalBooking({
      eventName: "[SLETT MEG] Integrasjonstest | Ekstern | E-tjenesten",
      roomId: 95, // Tivoli (has amfi)
      startDate: "2030-01-15",
      startTime: "20:00",
      endTime: "23:00",
      doorsTimes: ["19:30"],
      description:
        "Dette er en automatisk integrasjonstest. Ingen handling kreves.",
      audienceCount: 120,
      openOrClosed: "Lukket",
      furniture: "Bord og stoler til 30, scene, lerret",
      techEquipment:
        "Projektor + lerret, Mikrofon 2x, Musikkavspilling, Dedikert lydtekniker, Dedikert lystekniker",
      cateringWishes: "Buffet for 30 personer, 2 retter",
      freeOrPaid: "Betalt",
      ticketTypes: "Ordinær: 200 kr, Student: 150 kr, VIP: 400 kr",
      contactName: "E-Tjenesten",
      contactEmail: "e@samfunnetibergen.no",
      contactPhone: "+4740612345",
      needsAmphi: true, // Tivoli
      barSelf: false,
      barKvarteret: true,
      alternativeDates: ["2030-01-16", "2030-01-17"],
      roomIds: [95, 23], // Tivoli + Storelogen
      flexibleDates: false,
      onBehalfOfStudentOrg: true,
      studentOrgName: "Studentbergen Testforening",
      invoiceAddress: "Testveien 1, 5003 Bergen",
      orgNumber: 999999999,
      keyContacts: [
        {
          name: "E-Tjenesten",
          role: "Arrangør",
          email: "e@samfunnetibergen.no",
          phone: "+4740612345",
          country_code: "+47",
        },
      ],
      contactRole: "Arrangør",
    })

    const result = await postEventRequest(ROOM_BOOKING_SLUGS.ekstern, body)
    expect(
      result.ok,
      result.ok
        ? undefined
        : `POST failed: ${(result as { error: string }).error}`,
    ).toBe(true)
    if (result.ok) {
      expect(result.value).toBeGreaterThanOrEqual(200)
      expect(result.value).toBeLessThan(300)
    }
  }, 30_000)

  test("internal (DORG/BORG) form — all fields, HTTP 201", async () => {
    const body = buildInternalBooking({
      eventName: "[SLETT MEG] Integrasjonstest | Intern | E-tjenesten",
      roomId: 95, // Tivoli
      startDate: "2030-01-20",
      startTime: "18:00",
      endTime: "22:00",
      doorsTimes: ["17:30"],
      description:
        "Dette er en automatisk integrasjonstest. Ingen handling kreves.",
      audienceCount: 80,
      openOrClosed: "Lukket",
      furniture: "Bord og stoler til 20, podium",
      techEquipment: "Projektor + lerret, Mikrofon 2x, Dedikert lydtekniker",
      cateringWishes: "Enkel bevertning — kaffe og kanelsnurrer",
      freeOrPaid: "Gratis",
      ticketTypes: "",
      contactName: "E-Tjenesten",
      contactEmail: "e@samfunnetibergen.no",
      contactPhone: "+4740612345",
      needsAmphi: false,
      roomIds: [95, 23, 117], // Tivoli + Storelogen + Støy
      recurringDates: ["2030-01-21", "2030-01-28", "2030-02-04"],
      keyContacts: [
        {
          name: "E-Tjenesten",
          role: "Arrangør",
          email: "e@samfunnetibergen.no",
          phone: "+4740612345",
          country_code: "+47",
        },
        {
          name: "Teknisk Ansvarlig",
          role: "Tekniker",
          email: "teknisk@samfunnetibergen.no",
          phone: "+447400123456",
          country_code: "+44",
        },
      ],
      contactRole: "Arrangør",
    })

    const result = await postEventRequest(ROOM_BOOKING_SLUGS.intern, body)
    expect(
      result.ok,
      result.ok
        ? undefined
        : `POST failed: ${(result as { error: string }).error}`,
    ).toBe(true)
    if (result.ok) {
      expect(result.value).toBeGreaterThanOrEqual(200)
      expect(result.value).toBeLessThan(300)
    }
  }, 30_000)

  test("karaoke form — HTTP 201", async () => {
    const body = buildKaraokeRequest({
      eventName: "[SLETT MEG] Integrasjonstest | Karaoke | E-tjenesten",
      startDate: "2030-01-25",
      startTime: "21:00",
      durationHours: 2,
      numberOfPeople: 23,
      priceType: "ordinær",
      description:
        "Dette er en automatisk integrasjonstest. Ingen handling kreves.\n\n" +
        "EKSTRA, FRA BOOKING:\n" +
        "TYPE: Ekstern\n" +
        "PRIS: 3634 kr\n" +
        "PRISUTREGNING: 79 kr/pers × 23 pers (min 395 kr/t) × 2t = 3634 kr\n" +
        "LOVER FREMVISE STUDENTBEVIS?: nei\n" +
        "GODTATT BETINGELSER?: nei",
      contactName: "E-Tjenesten",
      contactEmail: "e@samfunnetibergen.no",
      contactPhone: "+4740612345",
    })

    const result = await postEventRequest(KARAOKE_SLUG, body)
    expect(
      result.ok,
      result.ok
        ? undefined
        : `POST failed: ${(result as { error: string }).error}`,
    ).toBe(true)
    if (result.ok) {
      expect(result.value).toBeGreaterThanOrEqual(200)
      expect(result.value).toBeLessThan(300)
    }
  }, 30_000)
})
