import { describe, expect, test } from "vitest"
import {
  buildNavigation,
  isNavigationItemActive,
  isNavigationLinkActive,
  type NavigationItem,
  type NavigationTranslationKey,
} from "./navigation-items"

const translations: Record<NavigationTranslationKey, string> = {
  volunteer: "Volunteer",
  events: "Events",
  booking: "Booking",
  allRooms: "All rooms",
  karaoke: "Karaoke",
  useful: "Useful information",
  overview: "Overview",
  vergeordning: "Vergeordningen",
  more: "More",
  contact: "Contact",
  sponsors: "Sponsors",
  linkInBio: "Link in bio",
  publicDocuments: "Public documents",
}

function getItem(items: NavigationItem[], id: string): NavigationItem {
  const item = items.find(candidate => candidate.id === id)
  if (!item) throw new Error(`Navigation item not found: ${id}`)
  return item
}

describe("buildNavigation", () => {
  test.each([
    "nb",
    "en",
  ] as const)("keeps canonical desktop and mobile destinations for %s", locale => {
    const items = buildNavigation(
      key => `${locale}:${translations[key]}`,
      "/nyttig#vergeordning-key",
    )
    const booking = getItem(items, "booking")
    const useful = getItem(items, "useful")
    const more = getItem(items, "more")

    expect(booking.label).toBe(`${locale}:Booking`)
    expect(booking.href).toBe("/rom")
    expect(booking.children?.[0]?.links.map(link => link.href)).toEqual([
      "/karaoke",
    ])
    expect(booking.mobile?.href).toBeNull()
    expect(booking.mobile?.groups[0]?.links.map(link => link.href)).toEqual([
      "/rom",
      "/karaoke",
    ])

    expect(useful.mobile?.groups[0]?.links.map(link => link.href)).toEqual([
      "/nyttig",
      "/nyttig#vergeordning-key",
    ])

    const moreLinks = more.children?.[0]?.links ?? []
    expect(moreLinks.find(link => link.id === "link-in-bio")).toMatchObject({
      href: "/linkibio",
      kind: "plain",
    })
    expect(
      moreLinks.find(link => link.id === "public-documents"),
    ).toMatchObject({
      href: "https://drive.google.com/drive/folders/0B0B-uQZgv7V3NHY0V0lXQUQ2elU?resourcekey=0-YYvE5cj9cKfVcTP4_p0w0Q",
      kind: "external",
    })
  })

  test("matches localized sections and their intended descendants", () => {
    const items = buildNavigation(
      key => translations[key],
      "/nyttig#vergeordning-key",
    )
    const events = getItem(items, "events")
    const booking = getItem(items, "booking")
    const useful = getItem(items, "useful")
    const more = getItem(items, "more")
    const moreLinks = more.children?.[0]?.links ?? []

    expect(isNavigationItemActive(events, "/arrangementer")).toBe(true)
    expect(isNavigationItemActive(events, "/arrangementer/kalender")).toBe(true)
    expect(isNavigationItemActive(events, "/rom")).toBe(false)
    expect(isNavigationItemActive(booking, "/rom/book")).toBe(true)
    expect(isNavigationItemActive(booking, "/karaoke")).toBe(true)
    expect(isNavigationItemActive(useful, "/nyttig#vergeordning-key")).toBe(
      true,
    )
    expect(isNavigationItemActive(more, "/kontakt")).toBe(true)
    const publicDocuments = moreLinks.find(
      link => link.id === "public-documents",
    )
    if (!publicDocuments) throw new Error("Public documents link not found")
    expect(isNavigationLinkActive(publicDocuments, "/en")).toBe(false)
  })
})
