import { describe, expect, it } from "vitest"
import {
  cropFromPercent,
  eventImageSelectionSchema,
  selectionFromCrop,
} from "./eventImage"

describe("event image selection", () => {
  it("turns the visible 16:9 region into Sanity crop and hotspot fractions", () => {
    const crop = cropFromPercent({ x: 10, y: 20, width: 80, height: 60 })
    const selection = selectionFromCrop(crop, { x: 0.25, y: 0.75 })
    expect(crop.left).toBeCloseTo(0.1)
    expect(crop.top).toBeCloseTo(0.2)
    expect(crop.right).toBeCloseTo(0.1)
    expect(crop.bottom).toBeCloseTo(0.2)
    expect(selection.hotspot.x).toBeCloseTo(0.3)
    expect(selection.hotspot.y).toBeCloseTo(0.65)
    expect(eventImageSelectionSchema.safeParse(selection).success).toBe(true)
  })

  it("rejects a focus region outside the crop", () => {
    const selection = selectionFromCrop(
      { left: 0.2, right: 0.2, top: 0.1, bottom: 0.1 },
      { x: 0.5, y: 0.5 },
    )
    expect(
      eventImageSelectionSchema.safeParse({
        ...selection,
        hotspot: { ...selection.hotspot, x: 0.01 },
      }).success,
    ).toBe(false)
  })
})
