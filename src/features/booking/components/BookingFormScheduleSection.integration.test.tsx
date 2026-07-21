/** @vitest-environment jsdom */

import { useForm } from "@tanstack/react-form"
import type { ComponentProps } from "react"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { initialBookingState } from "../domain/formState"
import type { BookingRoom } from "../types"
import { BookingFormScheduleSection } from "./BookingFormScheduleSection"
import { BookingFormContext } from "./bookingFormContext"

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

const TIVOLI: BookingRoom = {
  crescatRoomId: 95,
  title: "Tivoli",
  slug: null,
  summary: null,
  capacityStanding: null,
  capacitySeated: null,
  pricePerHour: null,
  openingHours: null,
  image: null,
  source: "crescat",
  floor: null,
  suitedPurposes: [],
  bar: null,
  hasSound: false,
  soundDetails: null,
  hasLighting: false,
  lightingDetails: null,
  hasAV: false,
  avDetails: null,
}

const DEFAULT_VALUES = {
  ...initialBookingState,
  selectedRoomIds: [95],
  startDate: "2026-08-29",
  startTime: "15:00",
  endTime: "23:00",
}

function ScheduleHarness() {
  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    onSubmit: () => undefined,
  })

  return (
    <BookingFormContext.Provider value={form}>
      <BookingFormScheduleSection
        closedDates={[]}
        occupiedRanges={[{ startMin: 0, endMin: 24 * 60 }]}
        openingHours={null}
        roomOccupancy={new Map([[95, ["3. jun 07:00 – 28. aug 13:00"]]])}
        rooms={[TIVOLI]}
        startDateId="booking-date"
      />
    </BookingFormContext.Provider>
  )
}

describe("BookingFormScheduleSection occupied selected room", () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement("div")
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  test("names the conflict and lets the user remove the occupied room", async () => {
    await act(async () => root.render(<ScheduleHarness />))

    expect(container.textContent).toContain("Tivoli er opptatt i valgt tidsrom")
    expect(container.textContent).toContain("3. jun 07:00 – 28. aug 13:00")

    const removeButton = Array.from(container.querySelectorAll("button")).find(
      button => button.textContent?.includes("Fjern Tivoli"),
    )
    expect(removeButton).toBeDefined()

    await act(async () => {
      removeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(container.textContent).not.toContain(
      "Tivoli er opptatt i valgt tidsrom",
    )
  })
})
