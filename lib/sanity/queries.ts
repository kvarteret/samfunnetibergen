import "server-only"

import type { ClientReturn } from "next-sanity"
import type { AppLocale } from "@/i18n/routing"
import type { VolunteerGroupContent, VolunteerGroupSummary } from "@/lib/volunteer-group-content"

import { sanityClient } from "./client"
import { sanityFetch } from "./live"
import {
    blifrivilligPageEnQuery,
    blifrivilligPageNbQuery,
    eventsPageContentEnQuery,
    eventsPageContentNbQuery,
    groupsPageQuery,
    homeBarsEnQuery,
    homeBarsNbQuery,
    homePageContentEnQuery,
    homePageContentNbQuery,
    navbarQuery,
    pageBySlugQuery,
    pageSlugsQuery,
    roomBySlugQuery,
    roomSlugsQuery,
    roomsPageQuery,
    roomsQuery,
    siteMetadataEnQuery,
    siteMetadataNbQuery,
    studentGroupBySlugQuery,
    studentGroupSlugsQuery,
    studentGroupsByCategory,
    studentGroupsQuery,
    volunteerGroupSummariesEnQuery,
    volunteerGroupSummariesNbQuery,
    volunteerGroupsEnQuery,
    volunteerGroupsNbQuery,
} from "./query-definitions"
import type {
    BlifrivilligPageContent,
    EventsPageContent,
    GroupsPageContent,
    HomeBarContent,
    HomePageContent,
    NavbarContent,
    PageContent,
    RoomDetail,
    RoomSummary,
    RoomsPageContent,
    SiteMetadataContent,
    StudentGroupDetail,
    StudentGroupSummary,
} from "./types"

type FetchOptions = {
    stega?: boolean
}

// ─── Blifrivillig page ────────────────────────────────────────────────────────

export async function fetchBlifrivilligPage(
    locale: AppLocale,
    options: FetchOptions = {},
): Promise<BlifrivilligPageContent | null> {
    const { data } = await sanityFetch({
        query: locale === "en" ? blifrivilligPageEnQuery : blifrivilligPageNbQuery,
        tags: ["blifrivilligPage"],
        stega: options.stega,
    })
    return data
}

// ─── Volunteer groups ────────────────────────────────────────────────────────

export async function fetchVolunteerGroups(locale: AppLocale): Promise<VolunteerGroupContent[]> {
    const groups = await sanityClient.fetch(
        locale === "en" ? volunteerGroupsEnQuery : volunteerGroupsNbQuery,
        {},
        { next: { revalidate: 300, tags: ["volunteerGroups"] } },
    )

    return groups.flatMap(group => {
        if (!group.slug) return []
        return [
            {
                ...group,
                slug: group.slug,
                accordionSections: (group.accordionSections ?? []).map(section => ({
                    ...section,
                    paragraphs: section.paragraphs ?? [],
                })),
                detailSections: (group.detailSections ?? []).map(section => ({
                    ...section,
                    paragraphs: section.paragraphs ?? [],
                })),
            },
        ]
    })
}

export async function fetchVolunteerGroupSummaries(
    locale: AppLocale,
): Promise<VolunteerGroupSummary[]> {
    const groups = await sanityClient.fetch(
        locale === "en" ? volunteerGroupSummariesEnQuery : volunteerGroupSummariesNbQuery,
        {},
        { next: { revalidate: 300, tags: ["volunteerGroupSummaries"] } },
    )

    return groups.flatMap((group: { name: string | null; description: string | null }) =>
        group.name ? [{ ...group, name: group.name }] : [],
    )
}

// ─── Home / events / site ────────────────────────────────────────────────────

export async function fetchHomePageContent(
    locale: AppLocale,
    options: FetchOptions = {},
): Promise<HomePageContent | null> {
    const { data } = await sanityFetch({
        query: locale === "en" ? homePageContentEnQuery : homePageContentNbQuery,
        tags: ["homePage"],
        stega: options.stega,
    })
    return data
}

export async function fetchEventsPageContent(
    locale: AppLocale,
    options: FetchOptions = {},
): Promise<EventsPageContent | null> {
    const { data } = await sanityFetch({
        query: locale === "en" ? eventsPageContentEnQuery : eventsPageContentNbQuery,
        tags: ["eventsPage"],
        stega: options.stega,
    })
    return data
}

export async function fetchSiteMetadata(
    locale: AppLocale,
    options: FetchOptions = {},
): Promise<SiteMetadataContent | null> {
    const { data } = await sanityFetch({
        query: locale === "en" ? siteMetadataEnQuery : siteMetadataNbQuery,
        tags: ["siteMetadata"],
        stega: options.stega,
    })
    return data
}

export async function fetchHomeBars(locale: AppLocale): Promise<HomeBarContent[]> {
    const { data } = await sanityFetch({
        query: locale === "en" ? homeBarsEnQuery : homeBarsNbQuery,
        tags: ["homeBars"],
    })
    return data
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

export async function fetchRoomsPageContent(
    options: FetchOptions = {},
): Promise<RoomsPageContent | null> {
    const { data } = await sanityFetch({
        query: roomsPageQuery,
        tags: ["roomsPage"],
        stega: options.stega,
    })
    return data
}

export async function fetchRooms(): Promise<RoomSummary[]> {
    const { data: rooms } = await sanityFetch({ query: roomsQuery, tags: ["rooms"] })
    type R = ClientReturn<typeof roomsQuery>[number]
    return rooms.flatMap((room: R) => (room.slug ? [{ ...room, slug: room.slug }] : []))
}

export async function fetchRoomSlugs(): Promise<string[]> {
    const rooms = await sanityClient.fetch(
        roomSlugsQuery,
        {},
        { next: { revalidate: 300, tags: ["rooms"] } },
    )
    return rooms.flatMap((room: { slug?: string | null }) => (room.slug ? [room.slug] : []))
}

export async function fetchRoomBySlug(
    slug: string,
    options: FetchOptions = {},
): Promise<RoomDetail | null> {
    const { data } = await sanityFetch({
        query: roomBySlugQuery,
        params: { slug },
        tags: ["rooms"],
        stega: options.stega,
    })
    return data
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export async function fetchGroupsPageContent(
    options: FetchOptions = {},
): Promise<GroupsPageContent | null> {
    const { data } = await sanityFetch({
        query: groupsPageQuery,
        tags: ["groupsPage"],
        stega: options.stega,
    })
    return data
}

export async function fetchStudentGroups(): Promise<StudentGroupSummary[]> {
    const { data: groups } = await sanityFetch({
        query: studentGroupsQuery,
        tags: ["studentGroups"],
    })
    type G = ClientReturn<typeof studentGroupsQuery>[number]
    return groups.flatMap((group: G) => (group.slug ? [{ ...group, slug: group.slug }] : []))
}

export async function fetchStudentGroupsByCategory(
    category: string,
): Promise<StudentGroupSummary[]> {
    const { data: groups } = await sanityFetch({
        query: studentGroupsByCategory,
        params: { category },
        tags: ["studentGroups"],
    })
    type G = ClientReturn<typeof studentGroupsQuery>[number]
    return groups.flatMap((group: G) => (group.slug ? [{ ...group, slug: group.slug }] : []))
}

export async function fetchStudentGroupSlugs(): Promise<string[]> {
    const groups = await sanityClient.fetch(
        studentGroupSlugsQuery,
        {},
        { next: { revalidate: 300, tags: ["studentGroups"] } },
    )
    return groups.flatMap((group: { slug?: string | null }) => (group.slug ? [group.slug] : []))
}

export async function fetchStudentGroupBySlug(
    slug: string,
    options: FetchOptions = {},
): Promise<StudentGroupDetail | null> {
    const { data } = await sanityFetch({
        query: studentGroupBySlugQuery,
        params: { slug },
        tags: ["studentGroups"],
        stega: options.stega,
    })
    return data
}

// ─── Pages (page builder) ─────────────────────────────────────────────────────

export async function fetchPageSlugs(): Promise<string[]> {
    const pages = await sanityClient.fetch(
        pageSlugsQuery,
        {},
        { next: { revalidate: 300, tags: ["pages"] } },
    )
    return pages.flatMap((p: { slug?: string | null }) => (p.slug ? [p.slug] : []))
}

export async function fetchPageBySlug(
    slug: string,
    options: FetchOptions = {},
): Promise<PageContent | null> {
    const { data } = await sanityFetch({
        query: pageBySlugQuery,
        params: { slug },
        tags: ["pages"],
        stega: options.stega,
    })
    return data
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export async function fetchNavbar(): Promise<NavbarContent | null> {
    const { data } = await sanityFetch({ query: navbarQuery, tags: ["navbar"] })
    return data
}
