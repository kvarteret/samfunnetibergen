import { afterEach, describe, expect, it, vi } from "vitest"
import {
  documentLocation,
  resolvePresentationInitialUrl,
  resolvePresentationOrigins,
} from "./routing"
import { volunteerListingHref, volunteerListingRoute } from "./resolve"

const originalPreviewUrl = process.env.SANITY_STUDIO_PREVIEW_URL
const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL

afterEach(() => {
  vi.unstubAllEnvs()

  if (originalPreviewUrl === undefined) {
    delete process.env.SANITY_STUDIO_PREVIEW_URL
  } else {
    process.env.SANITY_STUDIO_PREVIEW_URL = originalPreviewUrl
  }

  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl
  }
})

describe("Presentation URL configuration", () => {
  it("defaults local Presentation to the Next.js development port", () => {
    delete process.env.SANITY_STUDIO_PREVIEW_URL
    delete process.env.NEXT_PUBLIC_SITE_URL
    vi.stubEnv("NODE_ENV", "development")
    expect(resolvePresentationInitialUrl()).toBe("http://localhost:3187/nb")
  })

  it("defaults deployed Presentation to the production site", () => {
    delete process.env.SANITY_STUDIO_PREVIEW_URL
    delete process.env.NEXT_PUBLIC_SITE_URL
    vi.stubEnv("NODE_ENV", "production")
    expect(resolvePresentationInitialUrl()).toBe(
      "https://samfunnetibergen.no/nb",
    )
  })

  it("prefers the explicit Studio preview origin", () => {
    process.env.SANITY_STUDIO_PREVIEW_URL = "https://preview.example.com/path"
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com"
    expect(resolvePresentationInitialUrl()).toBe(
      "https://preview.example.com/nb",
    )
  })

  it("deduplicates configured trusted origins", () => {
    process.env.SANITY_STUDIO_PREVIEW_URL = "http://localhost:3187/nb"
    expect(resolvePresentationOrigins()).toContain("http://localhost:3187")
    expect(
      resolvePresentationOrigins().filter(
        origin => origin === "http://localhost:3187",
      ),
    ).toHaveLength(1)
  })

  it("trusts production without retaining the retired develop origin", () => {
    const origins = resolvePresentationOrigins()
    expect(origins).toContain("https://samfunnetibergen.no")
    expect(origins).not.toContain("https://neste.samfunnetibergen.no")
  })
})

describe("Presentation document locations", () => {
  it("uses the canonical volunteer listing route", () => {
    expect(volunteerListingRoute).toBe("/:locale/bli-frivillig")
    expect(volunteerListingHref).toBe("/nb/bli-frivillig")
  })

  it("builds localized detail routes", () => {
    expect(documentLocation("Tivoli", "tivoli", "rom", "Ukjent rom")).toEqual([
      { title: "Tivoli", href: "/nb/rom/tivoli" },
    ])
  })

  it("uses a fallback title but never emits a route without a slug", () => {
    expect(documentLocation(undefined, "tivoli", "rom", "Ukjent rom")).toEqual([
      { title: "Ukjent rom", href: "/nb/rom/tivoli" },
    ])
    expect(documentLocation("Tivoli", undefined, "rom", "Ukjent rom")).toEqual(
      [],
    )
  })
})
