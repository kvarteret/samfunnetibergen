import { describe, expect, it } from "vitest"
import { eventImageUrl } from "./event-image-url"

describe("eventImageUrl", () => {
  const src =
    "https://cdn.sanity.io/images/mkjoahvv/production/abc123-1600x900.jpg"

  it("uses Sanity crop metadata and returns a 16:9 image", () => {
    const url = eventImageUrl(
      src,
      {
        asset: { _ref: "image-abc123-1600x900-jpg" },
        crop: { top: 0, bottom: 0, left: 0.1, right: 0.1 },
        hotspot: { x: 0.5, y: 0.5, width: 0.04, height: 0.04 },
      },
      1200,
    )
    expect(url).toContain("rect=160,90,1280,720")
    expect(url).toContain("w=1200&h=675")
  })

  it("center crops an old Sanity image with no crop metadata", () => {
    expect(eventImageUrl(src, null, 640)).toContain("w=640")
    expect(eventImageUrl(src, null, 640)).toContain("h=360")
  })
})
