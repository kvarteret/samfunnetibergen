import { describe, expect, it } from "vitest"
import { cropFrame, imageDimensions, relativeFrame } from "./imageFrames"

const asset = { _ref: "image-abc123-1600x1200-jpg" }

describe("imageDimensions", () => {
  it("reads dimensions from image asset references", () => {
    expect(imageDimensions(asset._ref)).toEqual({ width: 1600, height: 1200 })
    expect(imageDimensions("file-abc-pdf")).toBeNull()
    expect(imageDimensions(undefined)).toBeNull()
  })
})

describe("cropFrame", () => {
  it("uses the whole image when the ratio already matches", () => {
    expect(cropFrame({ asset }, 4 / 3)).toEqual({
      left: 0,
      top: 0,
      width: 1,
      height: 1,
    })
  })

  it("centres a 16:9 frame on the hotspot", () => {
    const frame = cropFrame(
      { asset, hotspot: { x: 0.5, y: 0.2, width: 0.1, height: 0.1 } },
      16 / 9,
    )
    expect(frame?.width).toBe(1)
    expect(frame?.height).toBeCloseTo(0.75)
    // The hotspot sits high, so the frame is pushed to the top edge.
    expect(frame?.top).toBe(0)
  })

  it("keeps the frame inside the editor's crop", () => {
    const frame = cropFrame(
      {
        asset: { _ref: "image-abc-2000x1000-png" },
        crop: { left: 0.1, right: 0.1, top: 0, bottom: 0 },
        hotspot: { x: 0.95, y: 0.5, width: 0.05, height: 0.05 },
      },
      4 / 3,
    )
    expect(frame).not.toBeNull()
    if (!frame) return
    expect(frame.left + frame.width).toBeCloseTo(0.9)
    expect(frame.width).toBeCloseTo((1000 * (4 / 3)) / 2000)
  })

  it("returns null without readable asset dimensions", () => {
    expect(cropFrame({ asset: { _ref: "image-x" } }, 1)).toBeNull()
  })
})

describe("relativeFrame", () => {
  it("expresses an inner frame relative to an outer frame", () => {
    expect(
      relativeFrame(
        { left: 0, top: 0.125, width: 1, height: 0.75 },
        { left: 0, top: 0, width: 1, height: 1 },
      ),
    ).toEqual({ left: 0, top: 0.125, width: 1, height: 0.75 })
  })

  it("clips frames that extend past the outer frame", () => {
    const frame = relativeFrame(
      { left: -0.1, top: 0, width: 0.5, height: 1 },
      { left: 0, top: 0, width: 1, height: 1 },
    )
    expect(frame.left).toBe(0)
    expect(frame.width).toBeCloseTo(0.4)
  })
})
