/**
 * Live smoke test — submits a real booking to Crescat.
 *
 * SKIPPED unless CRESCAT_LIVE_TEST=1 is set. Never runs in CI.
 * Bypasses server-action opening-hours/conflict checks (which need
 * RSC runtime) and tests the core builder + CSRF handshake directly.
 * Sets as many fields as possible to exercise the full payload shape.
 *
 * Usage:
 *   CRESCAT_LIVE_TEST=1 npx vitest run src/lib/integrations/crescat/live-smoke.test.ts
 */

import { describe, expect, test } from "vitest"

import { buildExternalBooking } from "./room-booking"
import { postEventRequest } from "./client"
import { ROOM_BOOKING_SLUGS } from "./room-booking"

const LIVE = process.env.CRESCAT_LIVE_TEST === "1"

describe.skipIf(!LIVE)("live smoke test — real Crescat submission", () => {
  test(
    "submits a standard-form room booking with all fields set and gets HTTP 201",
    async () => {
      const body = buildExternalBooking({
        eventName: "[SLETT MEG] Integrasjonstest | Crescat | E-tjenesten",
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
        flexibleDates: false,       // structured alternativeDates used instead
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

      const result = await postEventRequest(
        ROOM_BOOKING_SLUGS.ekstern,
        body,
      )

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
    },
    30_000,
  )
})
