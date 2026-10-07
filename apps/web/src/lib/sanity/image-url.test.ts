import { describe, expect, it } from "vitest"
import { sanityImageUrl } from "./image-url"

const src =
  "https://cdn.sanity.io/images/mkjoahvv/production/abc-1600x1200.jpg"

describe("sanityImageUrl", () => {
  it("crops around the editor's hotspot", () => {
    const url = new URL(
      sanityImageUrl(
        src,
        { width: 1600, height: 900 },
        { hotspot: { x: 0.5, y: 0.1, width: 0.1, height: 0.1 } },
      ),
    )
    expect(url.searchParams.get("rect")).toBe("0,0,1600,900")
    expect(url.searchParams.get("fit")).toBe("crop")
  })

  it("leaves the centre crop to the CDN without a frame", () => {
    const url = new URL(sanityImageUrl(src, { width: 1600, height: 900 }))
    expect(url.searchParams.has("rect")).toBe(false)
  })
})
