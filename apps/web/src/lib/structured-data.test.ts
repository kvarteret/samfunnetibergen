import { describe, expect, it } from "vitest"
import {
  flattenPublicOccurrences,
  type RawPublicEvent,
  resolvePublicEvent,
} from "@/features/events/domain/public-events"
import {
  buildEventFeedData,
  buildEventStructuredData,
  buildFaqPageStructuredData,
  buildOrganizationWebsiteGraph,
  serializeJsonLd,
} from "./structured-data"

const event: RawPublicEvent = {
  _id: "event-sommerfest",
  _updatedAt: "2026-07-01T10:00:00.000Z",
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
  room: {
    _id: "room-storsalen",
    title: "Storsalen",
    slug: "storsalen",
    floor: 1,
    imageUrl: null,
  },
  roomText: null,
  eventStatus: "scheduled" as const,
  isFree: false,
  priceStudent: 50,
  ticketUrl: "https://tickets.example.com/sommerfest",
}

function occurrencesFor(
  input: RawPublicEvent = event,
  range: { from: string | null; to: string | null } = {
    from: "2026-07-14",
    to: null,
  },
) {
  return flattenPublicOccurrences([resolvePublicEvent(input)], range)
}

describe("structured data", () => {
  it("builds linked organization, venue, and website entities", () => {
    expect(buildOrganizationWebsiteGraph("https://example.com")).toEqual({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://example.com#organization",
          name: "Samfunnet i Bergen",
          alternateName: "Studentersamfunnet i Bergen",
          url: "https://example.com",
          sameAs: [
            "https://www.facebook.com/studentersamfunnet/",
            "https://www.instagram.com/samfunnet/",
          ],
          location: { "@id": "https://example.com#place" },
        },
        {
          "@type": "Place",
          "@id": "https://example.com#place",
          name: "Det Akademiske Kvarter",
          alternateName: "Kvarteret",
          url: "https://example.com/nb",
          hasMap: expect.stringContaining(
            "google.com/maps/place/Det+Akademiske+Kvarter",
          ),
          address: {
            "@type": "PostalAddress",
            streetAddress: "Olav Kyrres gate 49",
            postalCode: "5015",
            addressLocality: "Bergen",
            addressCountry: "NO",
          },
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
    const data = buildEventStructuredData(occurrencesFor(), {
      siteUrl: "https://example.com",
      locale: "nb",
    })

    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Event",
          "@id": expect.stringContaining(
            "https://example.com/nb/arrangementer/sommerfest#occurrence%3A",
          ),
          url: "https://example.com/nb/arrangementer/sommerfest",
          startDate: "2026-07-15T17:00:00.000Z",
          name: "Sommerfest",
          description: "Trygg <tekst>",
          location: {
            "@type": "Place",
            name: "Storsalen",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Olav Kyrres gate 49",
              postalCode: "5015",
              addressLocality: "Bergen",
              addressCountry: "NO",
            },
          },
          organizer: {
            "@type": "Organization",
            name: "Samfunnet i Bergen",
            url: "https://example.com",
          },
          inLanguage: "nb",
          offers: [
            expect.objectContaining({
              "@type": "Offer",
              price: "50",
              priceCurrency: "NOK",
              url: "https://tickets.example.com/sommerfest",
            }),
          ],
        },
        {
          "@id": expect.stringContaining(
            "https://example.com/nb/arrangementer/sommerfest#occurrence%3A",
          ),
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
    const feed = buildEventFeedData(occurrencesFor(), {
      siteUrl: "https://example.com",
      locale: "nb",
    })

    expect(feed).toMatchObject({
      "@type": "DataFeed",
      "@id": "https://example.com/api/events/feed",
      url: "https://example.com/api/events/feed",
      inLanguage: "nb",
    })
    expect(feed.dataFeedElement).toHaveLength(2)

    expect(feed.dataFeedElement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@type": "DataFeedItem",
          "@id": expect.stringContaining(
            "https://example.com/api/events/feed#occurrence%3A",
          ),
          item: expect.objectContaining({
            url: "https://example.com/nb/arrangementer/sommerfest",
          }),
        }),
      ]),
    )
  })

  it("uses Kvarteret's address only for referenced rooms", () => {
    const referencedRoom = buildEventStructuredData(
      occurrencesFor({
        ...event,
        room: {
          _id: "room-teglverket",
          title: "Teglverket",
          slug: "teglverket",
          floor: 1,
          imageUrl: null,
        },
        roomText: null,
      }),
      {
        siteUrl: "https://example.com",
        locale: "nb",
      },
    )
    const freeTextVenue = buildEventStructuredData(
      occurrencesFor({
        ...event,
        room: null,
        roomText: "Litteraturhuset, Østre Skostredet 5",
      }),
      {
        siteUrl: "https://example.com",
        locale: "nb",
      },
    )

    const referencedLocation = (
      referencedRoom as unknown as {
        "@graph": Array<Record<string, unknown>>
      }
    )["@graph"][0]?.location
    expect(referencedLocation).toMatchObject({
      "@type": "Place",
      name: "Teglverket",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Olav Kyrres gate 49",
        postalCode: "5015",
        addressLocality: "Bergen",
        addressCountry: "NO",
      },
      containedInPlace: { "@id": "https://example.com#place" },
    })
    const freeTextLocation = (
      freeTextVenue as unknown as {
        "@graph": Array<Record<string, unknown>>
      }
    )["@graph"][0]?.location
    expect(freeTextLocation).toMatchObject({
      "@type": "Place",
      name: "Litteraturhuset, Østre Skostredet 5",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Litteraturhuset, Østre Skostredet 5",
      },
    })
    expect(freeTextLocation).not.toHaveProperty("containedInPlace")
  })

  it("omits Event markup when the venue is missing", () => {
    expect(
      buildEventStructuredData(
        occurrencesFor({
          ...event,
          room: null,
          roomText: null,
        }),
        {
          siteUrl: "https://example.com",
          locale: "nb",
        },
      ),
    ).toBeNull()
  })

  it("links known organizer profiles and describes free admission as an offer", () => {
    const data = buildEventStructuredData(
      occurrencesFor({
        ...event,
        organizerGroup: {
          _id: "quiz-gruppen",
          name: "Quiz-gruppen",
          slug: "quiz-gruppen",
        },
        organizerText: null,
        isFree: true,
        priceStudent: null,
        ticketUrl: null,
      }),
      {
        siteUrl: "https://example.com",
        locale: "nb",
      },
    )

    const firstOccurrence = (
      data as unknown as {
        "@graph": Array<Record<string, unknown>>
      }
    )["@graph"][0]

    expect(firstOccurrence).toMatchObject({
      organizer: {
        "@type": "Organization",
        name: "Quiz-gruppen",
        url: "https://example.com/nb/grupper/quiz-gruppen",
      },
      offers: [
        expect.objectContaining({
          "@type": "Offer",
          price: "0",
          priceCurrency: "NOK",
          availability: "https://schema.org/InStock",
        }),
      ],
    })
  })

  it("builds FAQ markup from complete visible accordion items", () => {
    expect(
      buildFaqPageStructuredData([
        {
          _type: "editorialSection",
          items: [{ title: "Skjult?", body: "Nei" }],
        },
        {
          _type: "infoAccordionBlock",
          items: [
            {
              title: " Hvor ligger Kvarteret? ",
              body: [
                {
                  _key: "block-1",
                  _type: "block",
                  children: [
                    {
                      _key: "span-1",
                      _type: "span",
                      text: "I Olav Kyrres gate 49.",
                    },
                  ],
                  markDefs: [],
                  style: "normal",
                },
              ],
            },
            { title: "Tomt svar", body: [] },
            { title: "  ", body: "Har tekst" },
          ],
        },
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Hvor ligger Kvarteret?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "I Olav Kyrres gate 49.",
          },
        },
      ],
    })
  })

  it("omits FAQ markup when there are no complete answers", () => {
    expect(
      buildFaqPageStructuredData([
        {
          _type: "infoAccordionBlock",
          items: [{ title: "Ubesvart", body: [] }],
        },
      ]),
    ).toBeNull()
  })

  it("omits Event markup when every occurrence is historical", () => {
    expect(
      buildEventStructuredData(
        occurrencesFor({ ...event, dates: [event.dates?.[2] ?? null] }),
        {
          siteUrl: "https://example.com",
          locale: "nb",
        },
      ),
    ).toBeNull()
  })
})
