import { describe, expect, test } from "vitest"
import type { CresatBooking } from "@/lib/integrations/crescat/calendar"
import { isRoomOccupied } from "./availability"

const booking: CresatBooking = {
  id: 394377,
  resourceId: 96,
  event_id: 310742,
  start: "2026-09-10T11:00:00",
  end: "2026-09-10T17:30:00",
  color: "",
  title: "Test booking",
  part_of_event: false,
}

describe("isRoomOccupied", () => {
  test("keeps an adjacent Norwegian civil-time slot available", () => {
    expect(isRoomOccupied([booking], 96, "2026-09-10", "18:00", "22:00")).toBe(
      false,
    )
  })

  test("still detects an actual overlap", () => {
    expect(isRoomOccupied([booking], 96, "2026-09-10", "17:00", "18:00")).toBe(
      true,
    )
  })
})
