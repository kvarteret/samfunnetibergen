import { defineLocations, type PresentationPluginOptions } from "sanity/presentation"

const defaultLocale = "nb"

export const resolve: PresentationPluginOptions["resolve"] = {
    locations: {
        room: defineLocations({
            select: { title: "title", slug: "slug.current" },
            resolve: doc => ({
                locations: [
                    {
                        title: doc?.title ?? "Ukjent rom",
                        href: `/${defaultLocale}/rom/${doc?.slug}`,
                    },
                    { title: "Alle rom", href: `/${defaultLocale}/rom` },
                ],
            }),
        }),

        studentGroup: defineLocations({
            select: { title: "name", slug: "slug.current" },
            resolve: doc => ({
                locations: [
                    {
                        title: doc?.title ?? "Ukjent gruppe",
                        href: `/${defaultLocale}/grupper/${doc?.slug}`,
                    },
                    { title: "Alle grupper", href: `/${defaultLocale}/grupper` },
                ],
            }),
        }),

        page: defineLocations({
            select: { title: "title", slug: "slug.current" },
            resolve: doc => ({
                locations: [
                    {
                        title: doc?.title ?? "Ukjent side",
                        href: `/${defaultLocale}/${doc?.slug}`,
                    },
                ],
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

        homePage: defineLocations({
            select: {},
            resolve: () => ({
                locations: [{ title: "Forside", href: `/${defaultLocale}` }],
            }),
        }),

        eventsPage: defineLocations({
            select: {},
            resolve: () => ({
                locations: [{ title: "Arrangementer", href: `/${defaultLocale}/arrangementer` }],
            }),
        }),
    },
}
