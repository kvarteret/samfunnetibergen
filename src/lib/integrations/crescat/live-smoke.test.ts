/**
 * Live smoke test — submits a real booking to Crescat.
 *
 * SKIPPED unless CRESCAT_LIVE_TEST=1 is set. Never runs in CI.
 * Bypasses server-action opening-hours/conflict checks (which need
 * RSC runtime) and tests the core builder + CSRF handshake directly.
 *
 * Usage:
 *   CRESCAT_LIVE_TEST=1 npx vitest run src/lib/integrations/crescat/live-smoke.test.ts
 */

import { describe, expect, test } from "vitest"

import { buildRoomBooking } from "./room-booking"
import { postEventRequest } from "./client"
import { slugForBookerType } from "./room-booking"

const LIVE = process.env.CRESCAT_LIVE_TEST === "1"

describe.skipIf(!LIVE)("live smoke test — real Crescat submission", () => {
  test(
    "submits a standard-form room booking and gets HTTP 201",
    async () => {
      const input = {
        eventName: "[automated test] Live smoke test — please ignore",
        roomId: 95, // Tivoli
        startDate: "2030-01-15",
        startTime: "20:00",
        endTime: "23:00",
        description:
          "Dette er en automatisk test sendt av samfunnetibergen.no. Ingen handling kreves.",
        audienceCount: 1,
        openOrClosed: "Lukket" as const,
        furniture: "Ingen",
        techEquipment: "Ingen",
        cateringWishes: "",
        freeOrPaid: "Gratis" as const,
        ticketTypes: "",
        contactName: "Automatisk Test",
        contactEmail: "autotest@samfunnetibergen.no",
        contactPhone: "00000000",
        needsAmphi: false,
        barSelf: false,
        barKvarteret: false,
      }

      const body = buildRoomBooking("ekstern", input)
      const result = await postEventRequest(
        slugForBookerType("ekstern"),
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
