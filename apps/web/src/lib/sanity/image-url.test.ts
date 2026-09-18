import { describe, expect, test } from "vitest"

import { resolveContentImageAspectRatio } from "@/components/ui/content-image"
import {
  isSanityImageUrl,
  sanityImageAspectRatio,
  sanityImageUrl,
  shouldLoadImageDirectly,
} from "./image-url"

const LANDSCAPE =
  "https://cdn.sanity.io/images/mkjoahvv/production/f72595d9bb84c43dc946bfc8ae59558e4b20302d-1200x628.png"
const PORTRAIT =
  "https://cdn.sanity.io/images/mkjoahvv/production/a54456ec669d4795b40bf7f7b47c5c9f-1080x1350.jpg"

describe("sanityImageUrl", () => {
  test("fits the image inside the requested box instead of cropping it", () => {
    const url = new URL(sanityImageUrl(LANDSCAPE, { height: 900, width: 1600 }))

    expect(url.searchParams.get("fit")).toBe("max")
    expect(url.searchParams.get("fit")).not.toBe("crop")
    expect(url.searchParams.get("w")).toBe("1600")
    expect(url.searchParams.get("h")).toBe("900")
    expect(url.searchParams.get("auto")).toBe("format")
    expect(url.searchParams.get("q")).toBe("82")
  })

  test("keeps the source aspect ratio in the asset path", () => {
    // Sanity only trims the response, so the phone-sized dimensions must
    // survive for `sanityImageAspectRatio` to read them back.
    expect(sanityImageUrl(PORTRAIT, { height: 900, width: 1600 })).toContain(
      "-1080x1350.jpg",
    )
  })

  test("passes non-Sanity sources through untouched", () => {
    expect(sanityImageUrl("/images/logo.svg", { height: 10, width: 20 })).toBe(
      "/images/logo.svg",
    )
    expect(
      sanityImageUrl("https://cms.kvarteret.no/photo.jpg", {
        height: 10,
        width: 20,
      }),
    ).toBe("https://cms.kvarteret.no/photo.jpg")
  })
})

describe("sanityImageAspectRatio", () => {
  test("reads the source ratio from a Sanity asset URL", () => {
    expect(sanityImageAspectRatio(LANDSCAPE)).toBeCloseTo(1200 / 628)
    expect(sanityImageAspectRatio(PORTRAIT)).toBeCloseTo(1080 / 1350)
  })

  test("ignores transform parameters", () => {
    const transformed = sanityImageUrl(PORTRAIT, {
      height: 900,
      width: 1600,
    })

    expect(sanityImageAspectRatio(transformed)).toBeCloseTo(1080 / 1350)
  })

  test("returns null when the ratio is unknown", () => {
    expect(sanityImageAspectRatio("/images/logo.svg")).toBeNull()
    expect(sanityImageAspectRatio("not a url")).toBeNull()
    expect(
      sanityImageAspectRatio(
        "https://cdn.sanity.io/images/mkjoahvv/prod/x.png",
      ),
    ).toBeNull()
  })
})

describe("isSanityImageUrl", () => {
  test("only matches the Sanity CDN", () => {
    expect(isSanityImageUrl(LANDSCAPE)).toBe(true)
    expect(isSanityImageUrl("https://cms.kvarteret.no/photo.jpg")).toBe(false)
    expect(isSanityImageUrl("relative/path.png")).toBe(false)
  })
})

describe("shouldLoadImageDirectly", () => {
  test("bypasses the Next.js optimizer for already-sized sources", () => {
    expect(shouldLoadImageDirectly(LANDSCAPE)).toBe(true)
    expect(shouldLoadImageDirectly("blob:http://localhost/preview")).toBe(true)
    expect(shouldLoadImageDirectly("/images/logo.svg")).toBe(false)
  })
})

describe("resolveContentImageAspectRatio", () => {
  test("follows the artwork when the ratio is automatic", () => {
    expect(
      resolveContentImageAspectRatio({
        aspectRatio: "auto",
        maxAspectRatio: 21 / 9,
        minAspectRatio: 3 / 4,
        src: PORTRAIT,
      }),
    ).toBeCloseTo(1080 / 1350)
  })

  test("clamps ratios that would break the page rhythm", () => {
    // A very tall poster is capped so the frame cannot tower over the page.
    expect(
      resolveContentImageAspectRatio({
        aspectRatio: "auto",
        maxAspectRatio: 21 / 9,
        minAspectRatio: 4 / 3,
        src: PORTRAIT,
      }),
    ).toBe(4 / 3)

    // A wide panorama is capped so the frame cannot collapse to a sliver.
    expect(
      resolveContentImageAspectRatio({
        aspectRatio: "auto",
        maxAspectRatio: 21 / 9,
        minAspectRatio: 3 / 4,
        src: "https://cdn.sanity.io/images/mkjoahvv/production/x-4000x500.jpg",
      }),
    ).toBe(21 / 9)
  })

  test("falls back to a stable ratio for unknown sources", () => {
    expect(
      resolveContentImageAspectRatio({ aspectRatio: "auto", src: null }),
    ).toBe(16 / 9)
  })

  test("honours an explicit ratio and an unsized frame", () => {
    expect(
      resolveContentImageAspectRatio({
        aspectRatio: 16 / 9,
        src: PORTRAIT,
      }),
    ).toBe(16 / 9)
    expect(
      resolveContentImageAspectRatio({ aspectRatio: null, src: PORTRAIT }),
    ).toBeNull()
  })
})
