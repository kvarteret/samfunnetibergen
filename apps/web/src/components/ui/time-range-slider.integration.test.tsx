/** @vitest-environment jsdom */

import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { TimeRangeSlider } from "./time-range-slider"

describe("TimeRangeSlider controlled time reconciliation", () => {
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

  test("writes the visible clamped times back to the controlled form", async () => {
    const onStartChange = vi.fn()
    const onEndChange = vi.fn()

    await act(async () => {
      root.render(
        <TimeRangeSlider
          dayCount={1}
          endTime="23:00"
          marks={[20 * 60, 21 * 60, 22 * 60]}
          occupiedRanges={[]}
          onEndChange={onEndChange}
          onStartChange={onStartChange}
          startTime="19:00"
        />,
      )
    })

    expect(onStartChange).toHaveBeenCalledWith("20:00")
    expect(onEndChange).toHaveBeenCalledWith("22:00")
    expect(container.textContent).toContain("20:00")
    expect(container.textContent).toContain("22:00")
  })
})
