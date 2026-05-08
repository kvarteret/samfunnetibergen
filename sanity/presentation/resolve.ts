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
            route: "/:locale",
            filter: `_id == "homePage"`,
        },
        {
            route: "/:locale/home",
            filter: `_id == "homePage"`,
        },
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
                locations: [
                    { title: doc?.title ?? "Forside", href: `/${defaultLocale}` },
                    { title: "Homepage", href: "/en" },
                ],
            }),
        }),
        volunteerGroup: defineLocations({
            select: { title: "nameNb", slug: "slug" },
            resolve: doc => ({
                locations: [
                    {
                        title: doc?.title ?? "Frivilliggruppe",
                        href: `/${defaultLocale}/grupper/${doc?.slug}`,
                    },
                    {
                        title: "Volunteer group",
                        href: `/en/grupper/${doc?.slug}`,
                    },
                    { title: "Bli frivillig", href: `/${defaultLocale}/blifrivillig` },
                    { title: "Volunteer signup", href: "/en/blifrivillig" },
                ],
            }),
        }),
        volunteerGroupSummary: defineLocations({
            select: { title: "name" },
            resolve: doc => ({
                locations: [
                    {
                        title: doc?.title ?? "Bli frivillig",
                        href: `/${defaultLocale}/blifrivillig`,
                    },
                    { title: "Volunteer signup", href: "/en/blifrivillig" },
                ],
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

export function resolvePresentationInitialUrl() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

    if (!siteUrl) {
        return defaultPreviewPath
    }

    return new URL(defaultPreviewPath, siteUrl).toString()
}
