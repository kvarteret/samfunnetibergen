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

import { buildExternalBooking, buildInternalBooking, ROOM_BOOKING_SLUGS } from "./room-booking"
import { buildKaraokeRequest, KARAOKE_SLUG } from "./karaoke"
import { postEventRequest } from "./client"

const LIVE = process.env.CRESCAT_LIVE_TEST === "1"

describe.skipIf(!LIVE)("live smoke test — real Crescat submissions", () => {
  test(
    "external (standard) form — all fields, HTTP 201",
    async () => {
      const body = buildExternalBooking({
        eventName: "[SLETT MEG] Integrasjonstest | Ekstern | E-tjenesten",
        roomId: 95, // Tivoli (has amfi)
        startDate: "2030-01-15",
        startTime: "20:00",
        endTime: "23:00",
        doorsTime: "19:30",
        description:
          "Dette er en automatisk integrasjonstest. Ingen handling kreves.",
        audienceCount: 120,
        openOrClosed: "Lukket",
        furniture: "Bord og stoler til 30, scene, lerret",
        techEquipment: "Projektor + lerret, Mikrofon 2x, Musikkavspilling, Dedikert lydtekniker, Dedikert lystekniker",
        cateringWishes: "Buffet for 30 personer, 2 retter",
        freeOrPaid: "Betalt",
        ticketTypes: "Ordinær: 200 kr, Student: 150 kr, VIP: 400 kr",
        contactName: "Automatisk Test",
        contactEmail: "autotest@samfunnetibergen.no",
        contactPhone: "00000000",
        needsAmphi: true,           // Tivoli
        barSelf: false,
        barKvarteret: true,
        alternativeDates: ["2030-01-16", "2030-01-17"],
        roomIds: [95, 23],          // Tivoli + Storelogen
        flexibleDates: false,
        onBehalfOfStudentOrg: true,
        studentOrgName: "Studentbergen Testforening",
        invoiceAddress: "Testveien 1, 5003 Bergen",
        orgNumber: 999999999,
        keyContacts: [
          {
            name: "Automatisk Test",
            role: "Arrangør",
            email: "autotest@samfunnetibergen.no",
            phone: "00000000",
            country_code: "+47",
          },
        ],
        contactRole: "Arrangør",
      })

      const result = await postEventRequest(ROOM_BOOKING_SLUGS.ekstern, body)
      expect(
        result.ok,
        result.ok ? undefined : `POST failed: ${(result as { error: string }).error}`,
      ).toBe(true)
      if (result.ok) {
        expect(result.value).toBeGreaterThanOrEqual(200)
        expect(result.value).toBeLessThan(300)
      }
    },
    30_000,
  )

  test(
    "internal (DORG/BORG) form — all fields, HTTP 201",
    async () => {
      const body = buildInternalBooking({
        eventName: "[SLETT MEG] Integrasjonstest | Intern | E-tjenesten",
        roomId: 95, // Tivoli
        startDate: "2030-01-20",
        startTime: "18:00",
        endTime: "22:00",
        doorsTime: "17:30",
        description:
          "Dette er en automatisk integrasjonstest. Ingen handling kreves.",
        audienceCount: 80,
        openOrClosed: "Lukket",
        furniture: "Bord og stoler til 20, podium",
        techEquipment: "Projektor + lerret, Mikrofon 2x, Dedikert lydtekniker",
        cateringWishes: "Enkel bevertning — kaffe og kanelsnurrer",
        freeOrPaid: "Gratis",
        ticketTypes: "",
        contactName: "Automatisk Test",
        contactEmail: "autotest@samfunnetibergen.no",
        contactPhone: "00000000",
        needsAmphi: false,
        roomIds: [95, 23, 117],     // Tivoli + Storelogen + Støy
        keyContacts: [
          {
            name: "Automatisk Test",
            role: "Arrangør",
            email: "autotest@samfunnetibergen.no",
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
        result.ok ? undefined : `POST failed: ${(result as { error: string }).error}`,
      ).toBe(true)
      if (result.ok) {
        expect(result.value).toBeGreaterThanOrEqual(200)
        expect(result.value).toBeLessThan(300)
      }
    },
    30_000,
  )

  test(
    "karaoke form — HTTP 201",
    async () => {
      const body = buildKaraokeRequest({
        eventName: "[SLETT MEG] Integrasjonstest | Karaoke | E-tjenesten",
        startDate: "2030-01-25",
        startTime: "21:00",
        durationHours: 2,
        description:
          "Dette er en automatisk integrasjonstest. Ingen handling kreves.",
        contactName: "Automatisk Test",
        contactEmail: "autotest@samfunnetibergen.no",
        contactPhone: "00000000",
        numberOfPeople: 23,
        priceType: "ordinær",
      })

      const result = await postEventRequest(KARAOKE_SLUG, body)
      expect(
        result.ok,
        result.ok ? undefined : `POST failed: ${(result as { error: string }).error}`,
      ).toBe(true)
      if (result.ok) {
        expect(result.value).toBeGreaterThanOrEqual(200)
        expect(result.value).toBeLessThan(300)
      }
    },
    30_000,
  )
})
