import { describe, expect, it } from "vitest"

import { buildPageMetadata, buildRootMetadata } from "./page-metadata"

describe("page metadata", () => {
  it("uses the raw route title and emits complete social metadata", () => {
    const metadata = buildPageMetadata({
      canonicalPath: "/nb/fallback",
      title: "Fallback title",
      description: "Fallback description",
      imageUrl: "https://cdn.example.com/image.jpg",
    })

    expect(metadata).toMatchObject({
      title: "Fallback title",
      description: "Fallback description",
      alternates: { canonical: "/nb/fallback" },
      openGraph: {
        title: "Fallback title",
        description: "Fallback description",
        url: "/nb/fallback",
        siteName: "Samfunnet i Bergen",
        locale: "nb_NO",
        type: "website",
        images: [{ url: "https://cdn.example.com/image.jpg" }],
      },
      twitter: {
        card: "summary_large_image",
        title: "Fallback title",
        description: "Fallback description",
        images: ["https://cdn.example.com/image.jpg"],
      },
    })
  })

  it("uses the generated social image when a route has no image", () => {
    const metadata = buildPageMetadata({
      canonicalPath: "/nb/grupper",
      title: "Grupper",
      description: "Se gruppene.",
    })

    expect(metadata).toMatchObject({
      title: "Grupper",
      description: expect.any(String),
      alternates: { canonical: "/nb/grupper" },
      openGraph: { images: [{ url: "/opengraph-image" }] },
      twitter: { images: ["/opengraph-image"] },
    })
  })

  it("emits locale-aware alternates and Open Graph locale", () => {
    const metadata = buildPageMetadata({
      locale: "en",
      canonicalPath: "/en/grupper",
      title: "Groups",
      description: "Find student groups.",
    })

    expect(metadata).toMatchObject({
      alternates: {
        canonical: "/en/grupper",
        languages: {
          nb: "/nb/grupper",
          en: "/en/grupper",
          "x-default": "/nb/grupper",
        },
      },
      openGraph: { locale: "en_GB", url: "/en/grupper" },
    })
  })

  it("keeps the root title template and site defaults in one contract", () => {
    expect(buildRootMetadata("https://example.com")).toMatchObject({
      metadataBase: new URL("https://example.com"),
      title: {
        default: "Samfunnet i Bergen",
        template: "%s | Samfunnet i Bergen",
      },
      description: expect.any(String),
      openGraph: {
        siteName: "Samfunnet i Bergen",
        locale: "nb_NO",
        images: [{ url: "/opengraph-image" }],
      },
      twitter: {
        card: "summary_large_image",
        images: ["/opengraph-image"],
      },
    })
  })
})
