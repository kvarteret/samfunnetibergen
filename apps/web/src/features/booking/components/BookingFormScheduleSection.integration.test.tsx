/** @vitest-environment jsdom */

import { useForm } from "@tanstack/react-form"
import { NextIntlClientProvider } from "next-intl"
import type { ComponentProps } from "react"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { initialBookingState } from "../domain/formState"
import type { BookingRoom } from "../types"
import { BookingFormScheduleSection } from "./BookingFormScheduleSection"
import { BookingFormContext } from "./bookingFormContext"
import messages from "@/messages/nb.json"

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

function ScheduleHarness(
  props: Partial<ComponentProps<typeof BookingFormScheduleSection>>,
) {
  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    onSubmit: () => undefined,
  })

  return (
    <NextIntlClientProvider locale="nb" messages={messages}>
      <BookingFormContext.Provider value={form}>
        <BookingFormScheduleSection
          closedDates={[]}
          occupiedRanges={[{ startMin: 0, endMin: 24 * 60 }]}
          openingHours={null}
          roomOccupancy={new Map([[95, ["3. jun 07:00 – 28. aug 13:00"]]])}
          rooms={[TIVOLI]}
          startDateId="booking-date"
          today="2026-08-09"
          {...props}
        />
      </BookingFormContext.Provider>
    </NextIntlClientProvider>
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

  const rooms = [TIVOLI, { ...TIVOLI, crescatRoomId: 97, title: "Teglverket" }]

  test("focuses the direct room and lets the user add and remove another room", async () => {
    await act(async () =>
      root.render(
        <ScheduleHarness
          initialRoomId={95}
          roomOccupancy={new Map()}
          rooms={rooms}
        />,
      ),
    )
    expect(container.textContent).toContain("Tivoli")
    expect(container.textContent).not.toContain("Teglverket")
    const disclosure = Array.from(container.querySelectorAll("button")).find(
      button => button.textContent?.includes("Legg til flere rom"),
    )!
    expect(disclosure.type).toBe("button")
    expect(disclosure.getAttribute("aria-expanded")).toBe("false")
    await act(async () => disclosure.click())
    expect(container.textContent).toContain("Teglverket")

    const add = container.querySelector<HTMLButtonElement>(
      '[aria-label="Legg til rom i bookingen"]',
    )!
    await act(async () => add.click())
    expect(
      container.querySelectorAll('[aria-label="Fjern rom fra bookingen"]'),
    ).toHaveLength(2)
    await act(async () => disclosure.click())
    await act(async () => disclosure.click())
    expect(
      container.querySelectorAll('[aria-label="Fjern rom fra bookingen"]'),
    ).toHaveLength(2)
    const remove = Array.from(
      container.querySelectorAll<HTMLButtonElement>(
        '[aria-label="Fjern rom fra bookingen"]',
      ),
    ).at(-1)!
    await act(async () => remove.click())
    expect(
      container.querySelectorAll('[aria-label="Fjern rom fra bookingen"]'),
    ).toHaveLength(1)
  })

  test.each([
    undefined,
    999,
  ])("shows all rooms with initialRoomId=%s", async initialRoomId => {
    await act(async () =>
      root.render(
        <ScheduleHarness initialRoomId={initialRoomId} rooms={rooms} />,
      ),
    )
    expect(container.textContent).toContain("Tivoli")
    expect(container.textContent).toContain("Teglverket")
    expect(container.textContent).not.toContain("Legg til flere rom")
  })

  test("falls back when the direct room disappears from the offer", async () => {
    await act(async () =>
      root.render(<ScheduleHarness initialRoomId={95} rooms={rooms} />),
    )
    await act(async () =>
      root.render(<ScheduleHarness initialRoomId={95} rooms={[rooms[1]]} />),
    )
    expect(container.textContent).toContain("Teglverket")
    expect(container.textContent).not.toContain("Legg til flere rom")
  })
})
