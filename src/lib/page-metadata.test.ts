import { describe, expect, it } from "vitest"

import { buildPageMetadata } from "./page-metadata"

describe("page metadata", () => {
  it("uses route fallbacks and emits canonical metadata", () => {
    const metadata = buildPageMetadata({
      canonicalPath: "/nb/fallback",
      fallbackTitle: "Fallback title",
      fallbackDescription: "Fallback description",
      fallbackImageUrl: "https://cdn.example.com/image.jpg",
    })

    expect(metadata).toMatchObject({
      title: "Fallback title | Samfunnet i Bergen",
      description: "Fallback description",
      alternates: { canonical: "/nb/fallback" },
      openGraph: {
        title: "Fallback title",
        description: "Fallback description",
        images: [{ url: "https://cdn.example.com/image.jpg" }],
      },
    })
  })

  it("falls back to route-derived metadata without blocking indexing", () => {
    const metadata = buildPageMetadata({
      canonicalPath: "/nb/grupper",
      fallbackTitle: "Grupper",
      fallbackDescription: "Se gruppene.",
    })

    expect(metadata).toMatchObject({
      title: "Grupper | Samfunnet i Bergen",
      alternates: { canonical: "/nb/grupper" },
    })
  })
})
