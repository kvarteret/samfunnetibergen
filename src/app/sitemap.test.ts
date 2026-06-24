import { describe, expect, it } from "vitest"

import {
  buildLocalizedSitemapEntries,
  PUBLIC_STATIC_PATHS,
} from "./sitemapEntries"

describe("sitemap entries", () => {
  it("includes public fixed routes and excludes retired or internal routes", () => {
    expect(PUBLIC_STATIC_PATHS).toContain("/grupper")
    expect(PUBLIC_STATIC_PATHS).toContain("/arrangementer")
    expect(PUBLIC_STATIC_PATHS).not.toContain("/blifrivillig")
    expect(PUBLIC_STATIC_PATHS).not.toContain("/design")
    expect(PUBLIC_STATIC_PATHS).not.toContain("/studio")
    expect(PUBLIC_STATIC_PATHS).not.toContain("/arrangementer/ny")
  })

  it("does not expose code-owned generic page slugs", () => {
    expect(PUBLIC_STATIC_PATHS).toContain("/karaoke")
  })

  it("builds localized URLs and language alternates", () => {
    const entries = buildLocalizedSitemapEntries({
      locales: ["nb"],
      paths: ["/", "/rom", "/rom/det-akademiske-kvarter"],
      siteUrl: "https://example.com",
      lastModified: new Date("2026-06-12T00:00:00.000Z"),
    })

    expect(entries.map(entry => entry.url)).toEqual([
      "https://example.com/nb",
      "https://example.com/nb/rom",
      "https://example.com/nb/rom/det-akademiske-kvarter",
    ])
    expect(entries[1].alternates?.languages).toEqual({
      nb: "https://example.com/nb/rom",
    })
  })
})
