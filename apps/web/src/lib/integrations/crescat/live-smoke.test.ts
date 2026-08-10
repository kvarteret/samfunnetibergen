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
          phone: "00000000",
          country_code: "+47",
        },
        {
          name: "Teknisk Ansvarlig",
          role: "Tekniker",
          email: "teknisk@samfunnetibergen.no",
          phone: "11111111",
          country_code: "+47",
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
