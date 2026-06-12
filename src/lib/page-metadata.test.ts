import { describe, expect, it } from "vitest"

import { buildPageMetadata } from "./page-metadata"

describe("page metadata", () => {
  it("uses editorial overrides and emits robots and canonical metadata", () => {
    const metadata = buildPageMetadata({
      content: {
        canonicalUrl: "https://example.com/original",
        noFollow: true,
        noIndex: true,
        openGraphDescription: "Social description",
        openGraphImageAlt: "People gathered in a hall",
        openGraphImageUrl: "https://cdn.example.com/image.jpg",
        openGraphTitle: "Social title",
        seoDescription: "Search description",
        seoTitle: "Search title",
      },
      canonicalPath: "/nb/fallback",
      fallbackTitle: "Fallback title",
    })

    expect(metadata).toMatchObject({
      title: "Search title | Samfunnet i Bergen",
      description: "Search description",
      alternates: { canonical: "https://example.com/original" },
      robots: { index: false, follow: false },
      openGraph: {
        title: "Social title",
        description: "Social description",
        images: [
          {
            url: "https://cdn.example.com/image.jpg",
            alt: "People gathered in a hall",
          },
        ],
      },
    })
  })

  it("falls back to route-derived metadata without blocking indexing", () => {
    const metadata = buildPageMetadata({
      content: null,
      canonicalPath: "/nb/grupper",
      fallbackTitle: "Grupper",
      fallbackDescription: "Se gruppene.",
    })

    expect(metadata).toMatchObject({
      title: "Grupper | Samfunnet i Bergen",
      alternates: { canonical: "/nb/grupper" },
      robots: { index: true, follow: true },
    })
  })
})
