import { describe, expect, it } from "vitest"

import {
  VOLUNTEER_CANONICAL_URL,
  VOLUNTEER_LISTING_PATH,
  VOLUNTEER_PAGE_DESCRIPTION,
  VOLUNTEER_PAGE_INTRO,
  VOLUNTEER_PAGE_TITLE,
  VOLUNTEER_REDIRECTS,
} from "./volunteer-routes"

describe("volunteer route contract", () => {
  it("uses one canonical listing path", () => {
    expect(VOLUNTEER_LISTING_PATH).toBe("/bli-frivillig")
    expect(VOLUNTEER_CANONICAL_URL).toBe(
      "https://samfunnetibergen.no/nb/bli-frivillig",
    )
    expect(VOLUNTEER_PAGE_TITLE).toBe("Bli frivillig")
    expect(VOLUNTEER_PAGE_DESCRIPTION).toContain("frivillig i Bergen")
    expect(VOLUNTEER_PAGE_INTRO).toContain("frivillig i Bergen")
  })

  it("redirects the volunteer domain directly to the final canonical URL", () => {
    expect(VOLUNTEER_REDIRECTS[0]).toMatchObject({
      source: "/:path*",
      has: [
        {
          type: "host",
          value: "(?:www\\.)?blifrivillig\\.no",
        },
      ],
      destination: VOLUNTEER_CANONICAL_URL,
      permanent: true,
    })
  })

  it("redirects retired localized and unlocalized listing paths", () => {
    expect(VOLUNTEER_REDIRECTS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "/grupper",
          destination: "/nb/bli-frivillig",
          permanent: true,
        }),
        expect.objectContaining({
          source: "/:locale/grupper",
          destination: "/:locale/bli-frivillig",
          permanent: true,
        }),
        expect.objectContaining({
          source: "/:locale/blifrivillig",
          destination: "/:locale/bli-frivillig",
          permanent: true,
        }),
        expect.objectContaining({
          source: "/komiteer",
          destination: "/nb/bli-frivillig",
          permanent: true,
        }),
        expect.objectContaining({
          source: "/bli-aktiv",
          destination: "/nb/bli-frivillig",
          permanent: true,
        }),
      ]),
    )
  })

  it("does not redirect individual group detail paths", () => {
    expect(VOLUNTEER_REDIRECTS).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "/:locale/grupper/:group" }),
      ]),
    )
  })
})
