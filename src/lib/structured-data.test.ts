import { describe, expect, it } from "vitest"

import {
  buildEventFeedData,
  buildEventStructuredData,
  buildOrganizationWebsiteGraph,
  serializeJsonLd,
} from "./structured-data"

const event = {
  slug: "sommerfest",
  title: "Sommerfest",
  dates: [
    {
      _key: "occurrence-a",
      startDate: "2026-07-15",
      startTime: "19:00",
      endTime: null,
    },
    {
      _key: "date-only",
      startDate: "2026-07-16",
    },
    {
      _key: "past",
      startDate: "2026-07-13",
      startTime: "19:00",
      endTime: "21:00",
    },
  ],
  description: [
    {
      _key: "block-1",
      _type: "block",
      children: [{ _key: "span-1", _type: "span", text: "Trygg <tekst>" }],
      markDefs: [],
      style: "normal",
    },
  ],
  imageUrl: "https://cdn.example.com/sommerfest.jpg",
  organizerText: "Samfunnet i Bergen",
  roomText: "Storsalen",
  eventStatus: "scheduled" as const,
  isFree: false,
  priceStudent: 50,
  ticketUrl: "https://tickets.example.com/sommerfest",
}

describe("structured data", () => {
  it("builds a minimal organization and website graph", () => {
    expect(buildOrganizationWebsiteGraph("https://example.com")).toEqual({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://example.com#organization",
          name: "Samfunnet i Bergen",
          url: "https://example.com",
        },
        {
          "@type": "WebSite",
          "@id": "https://example.com#website",
          name: "Samfunnet i Bergen",
          url: "https://example.com",
          publisher: { "@id": "https://example.com#organization" },
          inLanguage: "nb",
        },
      ],
    })
  })

  it("escapes CMS angle brackets before embedding JSON-LD", () => {
    const serialized = serializeJsonLd({ description: "</script><script>" })

    expect(serialized).not.toContain("<")
    expect(serialized).toContain("\\u003c/script>")
  })

  it("builds localized future event occurrences without fabricating end times", () => {
    const data = buildEventStructuredData(event, {
      siteUrl: "https://example.com",
      locale: "nb",
      today: "2026-07-14",
    })

    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Event",
          "@id": "https://example.com/nb/arrangementer/sommerfest#occurrence-a",
          url: "https://example.com/nb/arrangementer/sommerfest",
          startDate: "2026-07-15T19:00:00.000+02:00",
          name: "Sommerfest",
          description: "Trygg <tekst>",
          location: { "@type": "Place", name: "Storsalen" },
          organizer: { "@type": "Organization", name: "Samfunnet i Bergen" },
          inLanguage: "nb",
          offers: {
            "@type": "Offer",
            price: "50",
            priceCurrency: "NOK",
            url: "https://tickets.example.com/sommerfest",
          },
        },
        {
          "@id": "https://example.com/nb/arrangementer/sommerfest#date-only",
          startDate: "2026-07-16",
        },
      ],
    })

    const nodes = (
      data as unknown as { "@graph": Array<Record<string, unknown>> }
    )["@graph"]
    expect(nodes).toHaveLength(2)
    expect(nodes[0]).not.toHaveProperty("endDate")
    expect(nodes[1]).not.toHaveProperty("endDate")
  })

  it("shares event nodes with the localized event feed", () => {
    const feed = buildEventFeedData([event], {
      siteUrl: "https://example.com",
      locale: "nb",
      today: "2026-07-14",
    })

    expect(feed).toMatchObject({
      "@type": "ItemList",
      url: "https://example.com/nb/arrangementer",
      numberOfItems: 2,
    })

    expect(feed.itemListElement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@type": "ListItem",
          item: expect.objectContaining({
            url: "https://example.com/nb/arrangementer/sommerfest",
          }),
        }),
      ]),
    )
  })

  it("omits Event markup when every occurrence is historical", () => {
    expect(
      buildEventStructuredData(
        { ...event, dates: [event.dates[2]] },
        {
          siteUrl: "https://example.com",
          locale: "nb",
          today: "2026-07-14",
        },
      ),
    ).toBeNull()
  })
})
