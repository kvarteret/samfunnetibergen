import { describe, expect, it } from "vitest"
import { cropFrame, imageDimensions, rectParam } from "./image-frame"

describe("imageDimensions", () => {
  it("reads asset references and CDN URLs", () => {
    expect(imageDimensions("image-abc-1600x1200-jpg")).toEqual({
      width: 1600,
      height: 1200,
    })
    expect(
      imageDimensions(
        "https://cdn.sanity.io/images/p/production/abc-2000x1000.png?w=10",
      ),
    ).toEqual({ width: 2000, height: 1000 })
    expect(imageDimensions("https://example.com/photo.jpg")).toBeNull()
  })
})

describe("cropFrame", () => {
  const size = { width: 1600, height: 1200 }

  it("uses the whole image when the ratio matches", () => {
    expect(cropFrame(size, null, 4 / 3)).toEqual({
      left: 0,
      top: 0,
      width: 1,
      height: 1,
    })
  })

  it("centres on the hotspot and stays inside the image", () => {
    const frame = cropFrame(
      size,
      { hotspot: { x: 0.5, y: 0.2, width: 0.1, height: 0.1 } },
      16 / 9,
    )
    expect(frame.width).toBe(1)
    expect(frame.height).toBeCloseTo(0.75)
    expect(frame.top).toBe(0)
  })

  it("keeps the frame inside the editor's crop", () => {
    const frame = cropFrame(
      { width: 2000, height: 1000 },
      {
        crop: { left: 0.1, right: 0.1, top: 0, bottom: 0 },
        hotspot: { x: 0.95, y: 0.5, width: 0.05, height: 0.05 },
      },
      4 / 3,
    )
    expect(frame.left + frame.width).toBeCloseTo(0.9)
  })
})

describe("rectParam", () => {
  it("converts a frame to pixels", () => {
    expect(
      rectParam(
        { width: 1600, height: 1200 },
        { left: 0, top: 0.125, width: 1, height: 0.75 },
      ),
    ).toBe("0,150,1600,900")
  })
})
