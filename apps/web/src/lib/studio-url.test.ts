import { describe, expect, it } from "vitest"

import { legacyStudioRedirects, studioUrlFromLegacyPath } from "./studio-url"

describe("legacy Studio redirects", () => {
  it("redirects the old root to the standalone Studio root", () => {
    expect(studioUrlFromLegacyPath("/studio")).toBe(
      "https://studio.samfunnetibergen.no/",
    )
  })

  it("removes the old prefix from deep links and preserves queries", () => {
    expect(
      studioUrlFromLegacyPath(
        "/studio/structure/arrangement",
        "?search=summer&intent=edit",
      ),
    ).toBe(
      "https://studio.samfunnetibergen.no/structure/arrangement?search=summer&intent=edit",
    )
  })

  it("declares permanent rules for both root and deep links", () => {
    expect(legacyStudioRedirects).toEqual([
      {
        source: "/studio",
        destination: "https://studio.samfunnetibergen.no/",
        permanent: true,
      },
      {
        source: "/studio/:path*",
        destination: "https://studio.samfunnetibergen.no/:path*",
        permanent: true,
      },
    ])
  })

  it("rejects non-legacy paths", () => {
    expect(() => studioUrlFromLegacyPath("/nb")).toThrow(
      "Expected a legacy Studio path",
    )
  })
})
