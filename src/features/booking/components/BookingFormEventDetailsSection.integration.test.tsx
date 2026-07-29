/** @vitest-environment jsdom */

import { useForm } from "@tanstack/react-form"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { initialBookingState } from "../domain/formState"
import { BookingFormEventDetailsSection } from "./BookingFormEventDetailsSection"
import { BookingFormContext } from "./bookingFormContext"

function EventDetailsHarness({
  startTime = "15:00",
  endTime = "23:00",
  crossMidnightHours = false,
}: {
  startTime?: string
  endTime?: string
  crossMidnightHours?: boolean
}) {
  const form = useForm({
    defaultValues: {
      ...initialBookingState,
      startDate: "2026-08-29",
      startTime,
      endTime,
    },
    onSubmit: () => undefined,
  })

  return (
    <BookingFormContext.Provider value={form}>
      <BookingFormEventDetailsSection
        audienceCountId="audience"
        closedDates={[]}
        eventNameId="event-name"
        openingHours={null}
        roomOpeningHours={
          crossMidnightHours
            ? {
                rows: [
                  {
                    weekdays: [6],
                    status: "open",
                    duration: { start: "18:00", end: "03:00" },
                  },
                ],
              }
            : null
        }
      />
    </BookingFormContext.Provider>
  )
}

describe("BookingFormEventDetailsSection timing fields", () => {
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

  test("renders doors and estimated end after the arrangement fields", async () => {
    await act(async () => root.render(<EventDetailsHarness />))

    const description = container.querySelector("textarea")
    const doorsLabel = Array.from(container.querySelectorAll("label")).find(
      label => label.textContent?.startsWith("Dørene åpner"),
    )

    expect(description).not.toBeNull()
    expect(doorsLabel).toBeDefined()
    if (!description || !doorsLabel) throw new Error("Timing fields not found")
    expect(
      description.compareDocumentPosition(doorsLabel) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(container.textContent).toContain("Antatt slutt (valgfritt)")
  })

  test("does not render a doors dropdown with no valid options", async () => {
    await act(async () =>
      root.render(
        <EventDetailsHarness
          crossMidnightHours
          endTime="00:30"
          startTime="23:30"
        />,
      ),
    )

    expect(container.textContent).not.toContain("Dørene åpner")
  })
})
