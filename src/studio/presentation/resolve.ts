import {
  defineDocuments,
  defineLocations,
  type PresentationPluginOptions,
} from "sanity/presentation"

import { documentLocation } from "./routing"

const defaultLocale = "nb"

export {
  resolvePresentationInitialUrl,
  resolvePresentationOrigins,
} from "./routing"

export const resolve: PresentationPluginOptions["resolve"] = {
  mainDocuments: defineDocuments([
    {
      route: "/linkibio",
      filter: `_id == "linkInBio"`,
    },
    {
      route: "/:locale",
      filter: `_id == "homePage"`,
    },
    {
      route: "/:locale/arrangementer",
      filter: `_id == "eventsPage"`,
    },
    {
      route: "/:locale/arrangementer/:slug",
      filter: `_type == "arrangement" && slug.current == $slug`,
    },
    {
      route: "/:locale/kontakt",
      filter: `_id == "kontaktPage"`,
    },
    {
      route: "/:locale/sponsorer",
      filter: `_id == "sponsorsPage"`,
    },
    {
      route: "/:locale/rom",
      filter: `_id == "roomsPage"`,
    },
    {
      route: "/:locale/rom/:slug",
      filter: `_type == "room" && slug.current == $slug`,
    },
    {
      route: "/:locale/grupper",
      filter: `_id == "groupsPage"`,
    },
    {
      route: "/:locale/grupper/:slug",
      filter: `_type == "studentGroup" && slug.current == $slug`,
    },
    {
      route: "/:locale/:slug",
      filter: `_type == "page" && slug.current == $slug && !(slug.current in ["arrangementer", "grupper", "karaoke", "kontakt", "rom", "sponsorer"])`,
    },
  ]),
  locations: {
    homePage: defineLocations({
      select: {},
      resolve: () => ({
        locations: [{ title: "Hovedside", href: `/${defaultLocale}` }],
      }),
    }),
    room: defineLocations({
      select: { title: "title", slug: "slug.current" },
      resolve: doc => ({
        locations: [
          ...documentLocation(doc?.title, doc?.slug, "rom", "Ukjent rom"),
          { title: "Alle rom", href: `/${defaultLocale}/rom` },
        ],
      }),
    }),

    studentGroup: defineLocations({
      select: { title: "name", slug: "slug.current" },
      resolve: doc => ({
        locations: [
          ...documentLocation(
            doc?.title,
            doc?.slug,
            "grupper",
            "Ukjent gruppe",
          ),
          { title: "Alle grupper", href: `/${defaultLocale}/grupper` },
        ],
      }),
    }),

    page: defineLocations({
      select: { title: "title", slug: "slug.current" },
      resolve: doc => ({
        locations: doc?.slug
          ? [
              {
                title: doc.title ?? "Ukjent side",
                href: `/${defaultLocale}/${doc.slug}`,
              },
            ]
          : [],
      }),
    }),

    roomsPage: defineLocations({
      select: {},
      resolve: () => ({
        locations: [{ title: "Rom", href: `/${defaultLocale}/rom` }],
      }),
    }),

    groupsPage: defineLocations({
      select: {},
      resolve: () => ({
        locations: [{ title: "Grupper", href: `/${defaultLocale}/grupper` }],
      }),
    }),

    sponsorsPage: defineLocations({
      select: {},
      resolve: () => ({
        locations: [
          { title: "Sponsorer", href: `/${defaultLocale}/sponsorer` },
        ],
      }),
    }),

    eventsPage: defineLocations({
      select: {},
      resolve: () => ({
        locations: [
          { title: "Arrangementer", href: `/${defaultLocale}/arrangementer` },
        ],
      }),
    }),

    arrangement: defineLocations({
      select: { title: "title", slug: "slug.current" },
      resolve: doc => ({
        locations: [
          ...documentLocation(
            doc?.title,
            doc?.slug,
            "arrangementer",
            "Ukjent arrangement",
          ),
          {
            title: "Alle arrangementer",
            href: `/${defaultLocale}/arrangementer`,
          },
        ],
      }),
    }),

    navbar: defineLocations({
      select: {},
      resolve: () => ({
        message: "Navigasjonen vises på alle offentlige sider.",
        tone: "positive",
      }),
    }),

    footer: defineLocations({
      select: {},
      resolve: () => ({
        message: "Footeren vises på alle offentlige sider.",
        tone: "positive",
      }),
    }),

    kontaktPage: defineLocations({
      select: {},
      resolve: () => ({
        locations: [{ title: "Kontakt", href: `/${defaultLocale}/kontakt` }],
      }),
    }),

    siteMetadata: defineLocations({
      select: {},
      resolve: () => ({
        message:
          "Metadata brukes på tvers av nettstedet og har ingen enkelt visningsside.",
        tone: "positive",
      }),
    }),

    linkInBio: defineLocations({
      select: {},
      resolve: () => ({
        locations: [{ title: "Link i bio", href: `/linkibio` }],
      }),
    }),
  },
}
