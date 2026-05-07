import { defineLocations, type PresentationPluginOptions } from "sanity/presentation"

export const resolve: PresentationPluginOptions["resolve"] = {
    locations: {
        room: defineLocations({
            select: { title: "title", slug: "slug.current" },
            resolve: doc => ({
                locations: [
                    {
                        title: doc?.title ?? "Ukjent rom",
                        href: `/rom/${doc?.slug}`,
                    },
                    { title: "Alle rom", href: "/rom" },
                ],
            }),
        }),

        studentGroup: defineLocations({
            select: { title: "name", slug: "slug.current" },
            resolve: doc => ({
                locations: [
                    {
                        title: doc?.title ?? "Ukjent gruppe",
                        href: `/grupper/${doc?.slug}`,
                    },
                    { title: "Alle grupper", href: "/grupper" },
                ],
            }),
        }),

        page: defineLocations({
            select: { title: "title", slug: "slug.current" },
            resolve: doc => ({
                locations: [
                    {
                        title: doc?.title ?? "Ukjent side",
                        href: `/${doc?.slug}`,
                    },
                ],
            }),
        }),

        roomsPage: defineLocations({
            select: {},
            resolve: () => ({
                locations: [{ title: "Rom", href: "/rom" }],
            }),
        }),

        groupsPage: defineLocations({
            select: {},
            resolve: () => ({
                locations: [{ title: "Grupper", href: "/grupper" }],
            }),
        }),

        homePage: defineLocations({
            select: {},
            resolve: () => ({
                locations: [{ title: "Forside", href: "/" }],
            }),
        }),

        eventsPage: defineLocations({
            select: {},
            resolve: () => ({
                locations: [{ title: "Arrangementer", href: "/arrangementer" }],
            }),
        }),
    },
}
