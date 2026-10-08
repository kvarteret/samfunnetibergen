import { describe, expect, it } from "vitest"
import { sanityImageFocus, sanityImageUrl } from "./image-url"

const src = "https://cdn.sanity.io/images/mkjoahvv/production/abc-1600x1200.jpg"

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

describe("sanityImageUrl without a height", () => {
  it("keeps the editor's crop at its own ratio", () => {
    const url = new URL(
      sanityImageUrl(
        src,
        { width: 800 },
        { crop: { top: 0.1, bottom: 0.1, left: 0.25, right: 0 } },
      ),
    )
    expect(url.searchParams.get("rect")).toBe("400,120,1200,960")
    expect(url.searchParams.get("w")).toBe("800")
    expect(url.searchParams.has("h")).toBe(false)
    expect(url.searchParams.has("fit")).toBe(false)
  })

  it("serves the whole image without a crop", () => {
    const url = new URL(sanityImageUrl(src, { width: 800 }, {}))
    expect(url.searchParams.has("rect")).toBe(false)
  })
})

describe("sanityImageFocus", () => {
  it("positions the preview on the region the CDN crops to", () => {
    // A 4:3 frame on a 4:3 image covers it all; a 16:9 frame at the top
    // edge sits at the start of the vertical axis.
    expect(sanityImageFocus(src, null, 4 / 3)).toEqual({ preview: "50% 50%" })
    expect(
      sanityImageFocus(
        src,
        { hotspot: { x: 0.5, y: 0.1, width: 0.1, height: 0.1 } },
        16 / 9,
      ),
    ).toEqual({ preview: "50% 0%" })
  })

  it("places the hotspot within the editor's crop for stretching boxes", () => {
    expect(
      sanityImageFocus(src, {
        crop: { top: 0, bottom: 0, left: 0.5, right: 0 },
        hotspot: { x: 0.75, y: 0.2, width: 0.1, height: 0.1 },
      }),
    ).toEqual({ image: "50% 20%", preview: "75% 20%" })
  })

  it("centres images without a hotspot", () => {
    expect(sanityImageFocus(src, null)).toEqual({ preview: "50% 50%" })
  })
})
