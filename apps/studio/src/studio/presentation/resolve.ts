import {
  defineDocuments,
  defineLocations,
  type PresentationPluginOptions,
} from "sanity/presentation"

import { documentLocation } from "./routing"

const defaultLocale = "nb"
export const volunteerListingRoute = "/:locale/bli-frivillig"
export const volunteerListingHref = `/${defaultLocale}/bli-frivillig`

export {
  resolvePresentationInitialUrl,
  resolvePresentationOrigins,
} from "./routing"

export const resolve: PresentationPluginOptions["resolve"] = {
  mainDocuments: defineDocuments([
    {
      route: "/:locale/arrangementer/:slug",
      filter: `_type == "arrangement" && slug.current == $slug`,
    },
    {
      route: "/:locale/kontakt",
      filter: `_id == "kontaktPage"`,
    },
    {
      route: "/:locale/nyttig",
      filter: `_id == "usefulInfoPage"`,
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
      route: volunteerListingRoute,
      filter: `_id == "groupsPage"`,
    },
    {
      route: "/:locale/grupper/:slug",
      filter: `_type == "studentGroup" && slug.current == $slug`,
    },
    {
      route: "/:locale/:slug",
      filter: `_type == "page" && slug.current == $slug && !(slug.current in ["arrangementer", "bli-frivillig", "grupper", "karaoke", "kontakt", "nyttig", "rom", "sponsorer", "tilgjengelighet"])`,
    },
  ]),
  locations: {
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
          { title: "Bli frivillig", href: volunteerListingHref },
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
        locations: [{ title: "Bli frivillig", href: volunteerListingHref }],
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

    kontaktPage: defineLocations({
      select: {},
      resolve: () => ({
        locations: [{ title: "Kontakt", href: `/${defaultLocale}/kontakt` }],
      }),
    }),

    usefulInfoPage: defineLocations({
      select: {},
      resolve: () => ({
        locations: [{ title: "Nyttig info", href: `/${defaultLocale}/nyttig` }],
      }),
    }),
  },
}
