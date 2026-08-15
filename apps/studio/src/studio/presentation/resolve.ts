import {
  defineDocuments,
  defineLocations,
  type PresentationPluginOptions,
} from "sanity/presentation"

import { documentLocation } from "./routing"

const defaultLocale = "nb"

function localizedNb(
  value: unknown,
  fallback?: string | null,
): string | undefined {
  if (Array.isArray(value)) {
    const item = value.find(
      candidate =>
        candidate &&
        typeof candidate === "object" &&
        "language" in candidate &&
        candidate.language === "nb" &&
        "value" in candidate &&
        typeof candidate.value === "string",
    ) as { value?: string } | undefined
    return item?.value ?? fallback ?? undefined
  }
  return typeof value === "string" ? value : (fallback ?? undefined)
}

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
      route: "/:locale/grupper",
      filter: `_id == "groupsPage"`,
    },
    {
      route: "/:locale/grupper/:slug",
      filter: `_type == "studentGroup" && slug.current == $slug`,
    },
    {
      route: "/:locale/:slug",
      filter: `_type == "page" && slug.current == $slug && !(slug.current in ["arrangementer", "grupper", "karaoke", "kontakt", "nyttig", "rom", "sponsorer", "tilgjengelighet"])`,
    },
  ]),
  locations: {
    room: defineLocations({
      select: {
        title: "localizedTitle",
        legacyTitle: "title",
        slug: "slug.current",
      },
      resolve: doc => ({
        locations: [
          ...documentLocation(
            localizedNb(doc?.title, doc?.legacyTitle),
            doc?.slug,
            "rom",
            "Ukjent rom",
          ),
          { title: "Alle rom", href: `/${defaultLocale}/rom` },
        ],
      }),
    }),

    studentGroup: defineLocations({
      select: {
        title: "localizedName",
        legacyTitle: "name",
        slug: "slug.current",
      },
      resolve: doc => ({
        locations: [
          ...documentLocation(
            localizedNb(doc?.title, doc?.legacyTitle),
            doc?.slug,
            "grupper",
            "Ukjent gruppe",
          ),
          { title: "Alle grupper", href: `/${defaultLocale}/grupper` },
        ],
      }),
    }),

    page: defineLocations({
      select: {
        title: "localizedTitle",
        legacyTitle: "title",
        slug: "slug.current",
      },
      resolve: doc => ({
        locations: doc?.slug
          ? [
              {
                title:
                  localizedNb(doc?.title, doc?.legacyTitle) ?? "Ukjent side",
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

    arrangement: defineLocations({
      select: {
        title: "localizedTitle",
        legacyTitle: "title",
        slug: "slug.current",
      },
      resolve: doc => ({
        locations: [
          ...documentLocation(
            localizedNb(doc?.title, doc?.legacyTitle),
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
