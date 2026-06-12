import { afterEach, describe, expect, it } from "vitest"
import { eventBySlugQuery } from "../../lib/sanity/queries/events"
import { studentGroupBySlugQuery } from "../../lib/sanity/queries/groups"
import {
  documentLocation,
  resolvePresentationInitialUrl,
  resolvePresentationOrigins,
} from "./routing"

const originalPreviewUrl = process.env.SANITY_STUDIO_PREVIEW_URL
const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL

afterEach(() => {
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
    expect(resolvePresentationInitialUrl()).toBe("http://localhost:3187/nb")
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
})

describe("Presentation document locations", () => {
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

describe("Presentation query compatibility", () => {
  it("allows authenticated preview to bypass public event visibility", () => {
    expect(eventBySlugQuery).toContain("$preview == true")
  })

  it("allows subgroup detail routes", () => {
    expect(studentGroupBySlugQuery).not.toContain("!defined(parentGroup)")
  })
})
