import "server-only"

import type { ClientReturn } from "next-sanity"
import type { AppLocale } from "@/i18n/routing"
import type { LaunchGroupContent, VolunteerGroupSummary } from "@/lib/volunteer-launch-content"

import { sanityClient } from "./client"
import {
    eventsPageContentEnQuery,
    eventsPageContentNbQuery,
    groupsPageQuery,
    homeBarsEnQuery,
    homeBarsNbQuery,
    homePageContentEnQuery,
    homePageContentNbQuery,
    launchGroupsEnQuery,
    launchGroupsNbQuery,
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
} from "./query-definitions"
import type {
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

// ─── Volunteer / launch groups (blifrivillig – kept for compat) ──────────────

export async function fetchLaunchGroups(locale: AppLocale): Promise<LaunchGroupContent[]> {
    const groups = await sanityClient.fetch(
        locale === "en" ? launchGroupsEnQuery : launchGroupsNbQuery,
        {},
        { next: { revalidate: 300, tags: ["launchGroups"] } },
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

    return groups.flatMap(group => (group.name ? [{ ...group, name: group.name }] : []))
}

// ─── Home / events / site ────────────────────────────────────────────────────

export async function fetchHomePageContent(locale: AppLocale): Promise<HomePageContent | null> {
    return sanityClient.fetch(
        locale === "en" ? homePageContentEnQuery : homePageContentNbQuery,
        {},
        { next: { revalidate: 300, tags: ["homePage"] } },
    )
}

export async function fetchEventsPageContent(locale: AppLocale): Promise<EventsPageContent | null> {
    return sanityClient.fetch(
        locale === "en" ? eventsPageContentEnQuery : eventsPageContentNbQuery,
        {},
        { next: { revalidate: 300, tags: ["eventsPage"] } },
    )
}

export async function fetchSiteMetadata(locale: AppLocale): Promise<SiteMetadataContent | null> {
    return sanityClient.fetch(
        locale === "en" ? siteMetadataEnQuery : siteMetadataNbQuery,
        {},
        { next: { revalidate: 300, tags: ["siteMetadata"] } },
    )
}

export async function fetchHomeBars(locale: AppLocale): Promise<HomeBarContent[]> {
    return sanityClient.fetch(
        locale === "en" ? homeBarsEnQuery : homeBarsNbQuery,
        {},
        { next: { revalidate: 300, tags: ["homeBars"] } },
    )
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

export async function fetchRoomsPageContent(): Promise<RoomsPageContent | null> {
    return sanityClient.fetch(
        roomsPageQuery,
        {},
        { next: { revalidate: 300, tags: ["roomsPage"] } },
    )
}

export async function fetchRooms(): Promise<RoomSummary[]> {
    const rooms = await sanityClient.fetch(
        roomsQuery,
        {},
        { next: { revalidate: 300, tags: ["rooms"] } },
    )
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

export async function fetchRoomBySlug(slug: string): Promise<RoomDetail | null> {
    return sanityClient.fetch(
        roomBySlugQuery,
        { slug },
        { next: { revalidate: 300, tags: ["rooms"] } },
    )
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export async function fetchGroupsPageContent(): Promise<GroupsPageContent | null> {
    return sanityClient.fetch(
        groupsPageQuery,
        {},
        { next: { revalidate: 300, tags: ["groupsPage"] } },
    )
}

export async function fetchStudentGroups(): Promise<StudentGroupSummary[]> {
    const groups = await sanityClient.fetch(
        studentGroupsQuery,
        {},
        { next: { revalidate: 300, tags: ["studentGroups"] } },
    )
    type G = ClientReturn<typeof studentGroupsQuery>[number]
    return groups.flatMap((group: G) => (group.slug ? [{ ...group, slug: group.slug }] : []))
}

export async function fetchStudentGroupsByCategory(
    category: string,
): Promise<StudentGroupSummary[]> {
    const groups = await sanityClient.fetch(
        studentGroupsByCategory,
        { category },
        { next: { revalidate: 300, tags: ["studentGroups"] } },
    )
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

export async function fetchStudentGroupBySlug(slug: string): Promise<StudentGroupDetail | null> {
    return sanityClient.fetch(
        studentGroupBySlugQuery,
        { slug },
        { next: { revalidate: 300, tags: ["studentGroups"] } },
    )
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

export async function fetchPageBySlug(slug: string): Promise<PageContent | null> {
    return sanityClient.fetch(
        pageBySlugQuery,
        { slug },
        { next: { revalidate: 300, tags: ["pages"] } },
    )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export async function fetchNavbar(): Promise<NavbarContent | null> {
    return sanityClient.fetch(navbarQuery, {}, { next: { revalidate: 300, tags: ["navbar"] } })
}
