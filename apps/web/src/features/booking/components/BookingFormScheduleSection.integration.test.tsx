/** @vitest-environment jsdom */

import { useForm } from "@tanstack/react-form"
import { NextIntlClientProvider } from "next-intl"
import type { ComponentProps } from "react"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import messages from "@/messages/nb.json"
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

  test.each([undefined, 999])(
    "shows all rooms with initialRoomId=%s",
    async initialRoomId => {
      await act(async () =>
        root.render(
          <ScheduleHarness initialRoomId={initialRoomId} rooms={rooms} />,
        ),
      )
      expect(container.textContent).toContain("Tivoli")
      expect(container.textContent).toContain("Teglverket")
      expect(container.textContent).not.toContain("Legg til flere rom")
    },
  )

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

describe("selected-room Crescat calendar availability", () => {
  test("allows partial bookings, blocks unavoidable collisions, and updates on month navigation", async () => {
    const container = document.createElement("div")
    document.body.append(container)
    const root = createRoot(container)
    const onVisibleMonthChange = vi.fn()
    try {
      await act(async () =>
        root.render(
          <ScheduleHarness
            calendarBookings={[
              { start: "2026-08-20T16:00:00", end: "2026-08-20T22:00:00" },
              { start: "2026-08-21T00:00:00", end: "2026-08-22T00:00:00" },
            ]}
            roomOccupancy={new Map()}
            occupiedRanges={[]}
            onVisibleMonthChange={onVisibleMonthChange}
          />,
        ),
      )
      const dayButton = (day: string) =>
        container.querySelector<HTMLButtonElement>(`button[data-day="${day}"]`)
      const partial = dayButton(
        new Date("2026-08-20T00:00:00").toLocaleDateString("nb"),
      )
      const full = dayButton(
        new Date("2026-08-21T00:00:00").toLocaleDateString("nb"),
      )
      expect(partial).not.toBeNull()
      expect(partial?.className).toContain("booking-partial")
      expect(partial?.disabled).toBe(false)
      expect(full?.className).toContain("booking-stripes")
      // Keep the trigger focusable so its explanation remains accessible.
      expect(full?.disabled).toBe(false)
      expect(full?.getAttribute("aria-disabled")).toBe("true")
      await act(async () => full?.click())
      expect(container.textContent).toContain("Booking starter fra 29. august.")

      await act(async () => partial?.click())
      expect(container.textContent).toContain("Booking starter fra 20. august.")
      const outsideWeek = dayButton(
        new Date("2026-08-27T00:00:00").toLocaleDateString("nb"),
      )
      expect(outsideWeek?.className).toContain("!opacity-25")
      expect(outsideWeek?.getAttribute("aria-disabled")).toBe("true")
      expect(
        dayButton(new Date("2026-08-26T00:00:00").toLocaleDateString("nb"))
          ?.className,
      ).not.toContain("!opacity-25")

      // A free endpoint cannot bypass a collision on the intervening day.
      const acrossCollision = dayButton(
        new Date("2026-08-22T00:00:00").toLocaleDateString("nb"),
      )
      expect(acrossCollision?.getAttribute("aria-disabled")).toBe("true")
      await act(async () => acrossCollision?.click())
      await act(async () => outsideWeek?.click())
      expect(
        container.querySelectorAll('button[data-range-end="true"]'),
      ).toHaveLength(0)
      expect(container.textContent).toContain("Booking starter fra 20. august.")

      // Clicking the start again completes a single-day booking, whose hours
      // can fit before or after the partial booking.
      await act(async () =>
        dayButton(
          new Date("2026-08-20T00:00:00").toLocaleDateString("nb"),
        )?.click(),
      )
      expect(container.textContent).toContain(
        "Booking starter fra 20. august, varer til 20. august.",
      )
      expect(
        container.querySelectorAll('button[data-range-start="true"]'),
      ).toHaveLength(1)
      expect(
        container.querySelectorAll('button[data-range-end="true"]'),
      ).toHaveLength(1)
      const selectedDay = dayButton(
        new Date("2026-08-20T00:00:00").toLocaleDateString("nb"),
      )
      await act(async () => {
        selectedDay?.focus()
        selectedDay?.dispatchEvent(
          new KeyboardEvent("keydown", {
            code: "Space",
            key: " ",
            bubbles: true,
            cancelable: true,
          }),
        )
      })
      const keyUp = new KeyboardEvent("keyup", {
        code: "Space",
        key: " ",
        bubbles: true,
        cancelable: true,
      })
      await act(async () => selectedDay?.dispatchEvent(keyUp))
      expect(keyUp.defaultPrevented).toBe(true)
      expect(container.textContent).not.toContain("Booking starter fra")
      expect(
        container.querySelectorAll('button[data-range-start="true"]'),
      ).toHaveLength(0)

      const pastDay = dayButton(
        new Date("2026-08-08T00:00:00").toLocaleDateString("nb"),
      )
      expect(pastDay?.getAttribute("aria-disabled")).toBe("true")
      await act(async () => pastDay?.click())
      expect(container.textContent).not.toContain("Booking starter fra")
      const todayDay = dayButton(
        new Date("2026-08-09T00:00:00").toLocaleDateString("nb"),
      )
      expect(todayDay?.querySelector(".bg-booking-today")).not.toBeNull()
      const nextMonth = container.querySelector<HTMLButtonElement>(
        "nav button:last-child",
      )
      expect(nextMonth).not.toBeNull()
      await act(async () => nextMonth?.click())
      expect(onVisibleMonthChange).toHaveBeenCalledWith("2026-09-01")
    } finally {
      await act(async () => root.unmount())
      container.remove()
    }
  })
})
