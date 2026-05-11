import {
    defineDocuments,
    defineLocations,
    type PresentationPluginOptions,
} from "sanity/presentation"

const defaultLocale = "nb"
const defaultPreviewPath = `/${defaultLocale}`

export const resolve: PresentationPluginOptions["resolve"] = {
    mainDocuments: defineDocuments([
        {
            route: "/:locale/arrangementer",
            filter: `_id == "eventsPage"`,
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
            filter: `_type == "page" && slug.current == $slug`,
        },
    ]),
    locations: {
        homeBar: defineLocations({
            select: { title: "nameNb" },
            resolve: doc => ({
                locations: [{ title: doc?.title ?? "Forside", href: `/${defaultLocale}` }],
            }),
        }),
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

        eventsPage: defineLocations({
            select: {},
            resolve: () => ({
                locations: [{ title: "Arrangementer", href: `/${defaultLocale}/arrangementer` }],
            }),
        }),

        navbar: defineLocations({
            select: {},
            resolve: () => ({
                locations: [{ title: "Alle sider (navigasjon)", href: `/${defaultLocale}` }],
            }),
        }),

        footer: defineLocations({
            select: {},
            resolve: () => ({
                locations: [{ title: "Alle sider (footer)", href: `/${defaultLocale}` }],
            }),
        }),

        kontaktPage: defineLocations({
            select: {},
            resolve: () => ({
                locations: [{ title: "Kontakt", href: `/${defaultLocale}/kontakt` }],
            }),
        }),

        blifrivilligPage: defineLocations({
            select: {},
            resolve: () => ({
                locations: [{ title: "Bli frivillig", href: `/${defaultLocale}/blifrivillig` }],
            }),
        }),

        siteMetadata: defineLocations({
            select: {},
            resolve: () => ({
                locations: [{ title: "Forside", href: `/${defaultLocale}` }],
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

export function resolvePresentationInitialUrl() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

    if (!siteUrl) {
        return defaultPreviewPath
    }

    return new URL(defaultPreviewPath, siteUrl).toString()
}
