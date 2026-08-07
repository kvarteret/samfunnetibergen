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
      canonicalPath: "/nb/bli-frivillig",
      title: "Bli frivillig",
      description: "Finn en studentgruppe i Bergen.",
    })

    expect(metadata).toMatchObject({
      title: "Bli frivillig",
      description: expect.any(String),
      alternates: { canonical: "/nb/bli-frivillig" },
      openGraph: { images: [{ url: "/opengraph-image" }] },
      twitter: { images: ["/opengraph-image"] },
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

  it("can keep a homepage entity title absolute under the root template", () => {
    expect(
      buildPageMetadata({
        canonicalPath: "/nb",
        title: "Samfunnet i Bergen – studentkultur på Kvarteret",
        absoluteTitle: true,
      }),
    ).toMatchObject({
      title: {
        absolute: "Samfunnet i Bergen – studentkultur på Kvarteret",
      },
      openGraph: {
        title: "Samfunnet i Bergen – studentkultur på Kvarteret",
      },
    })
  })
})
