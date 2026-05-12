import "server-only"

import { stegaClean } from "@sanity/client/stega"
import type { ClientReturn } from "next-sanity"
import type { AppLocale } from "@/i18n/routing"
import type { VolunteerGroupContent, VolunteerGroupSummary } from "@/lib/volunteer-group-content"
import type { VolunteerGroupsNbQueryResult } from "@/sanity.types"

import { sanityClient } from "./client"
import { sanityFetch } from "./live"
import {
    arrangementBySlugQuery,
    arrangementEventTypesQuery,
    arrangementGroupsQuery,
    arrangementRoomsQuery,
    blifrivilligPageNbQuery,
    eventsPageContentNbQuery,
    footerQuery,
    groupsPageQuery,
    homePageNbQuery,
    kontaktPageQuery,
    linkInBioQuery,
    navbarQuery,
    pageBySlugQuery,
    pageSlugsQuery,
    publishedArrangementsQuery,
    roomBySlugQuery,
    roomSlugsQuery,
    roomsPageQuery,
    roomsQuery,
    siteMetadataNbQuery,
    studentGroupBySlugQuery,
    studentGroupSlugsQuery,
    studentGroupsByCategory,
    studentGroupsQuery,
    volunteerGroupSummariesNbQuery,
    volunteerGroupsNbQuery,
} from "./query-definitions"
import type {
    BlifrivilligPageContent,
    EventsPageContent,
    GroupsPageContent,
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
    _locale: AppLocale,
    options: FetchOptions = {},
): Promise<BlifrivilligPageContent | null> {
    const { data } = await sanityFetch({
        query: blifrivilligPageNbQuery,
        tags: ["blifrivilligPage"],
        stega: options.stega,
    })
    return data
}

// ─── Volunteer groups ────────────────────────────────────────────────────────

export async function fetchVolunteerGroups(_locale: AppLocale): Promise<VolunteerGroupContent[]> {
    void _locale

    const { data: groups } = await sanityFetch({
        query: volunteerGroupsNbQuery,
        tags: ["volunteerGroups"],
    })

    type G = NonNullable<VolunteerGroupsNbQueryResult>[number]
    return (groups ?? [])
        .filter((group: G) => Boolean(group.slug))
        .map((group: G) => ({
            slug: group.slug!,
            name: group.name ?? null,
            eyebrow: group.eyebrow ?? null,
            lead: group.lead ?? null,
            imageUrl: group.imageUrl ?? null,
            accordionSections: (group.accordionSections ?? []).map(section => ({
                title: section.title ?? null,
                paragraphs: (section.paragraphs ?? []).filter((paragraph): paragraph is string =>
                    Boolean(paragraph),
                ),
            })),
            detailSections: [],
        }))
}

export async function fetchVolunteerGroupSummaries(
    _locale: AppLocale,
): Promise<VolunteerGroupSummary[]> {
    void _locale

    const { data: groups } = await sanityFetch({
        query: volunteerGroupSummariesNbQuery,
        tags: ["volunteerGroupSummaries"],
    })

    return (groups ?? []).flatMap((group: { name: string | null; description: string | null }) =>
        group.name ? [{ ...group, name: group.name }] : [],
    )
}

// ─── Events / site ────────────────────────────────────────────────────────────

export async function fetchEventsPageContent(
    _locale: AppLocale,
    options: FetchOptions = {},
): Promise<EventsPageContent | null> {
    const { data } = await sanityFetch({
        query: eventsPageContentNbQuery,
        tags: ["eventsPage"],
        stega: options.stega,
    })
    return data
}

export async function fetchSiteMetadata(
    _locale: AppLocale,
    options: FetchOptions = {},
): Promise<SiteMetadataContent | null> {
    const { data } = await sanityFetch({
        query: siteMetadataNbQuery,
        tags: ["siteMetadata"],
        stega: options.stega,
    })
    return data
}

export async function fetchHomePageContent(
    _locale: AppLocale,
    options: FetchOptions = {},
): Promise<HomePageContent | null> {
    const { data } = await sanityFetch({
        query: homePageNbQuery,
        tags: ["homePage"],
        stega: options.stega,
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
    return rooms.flatMap((room: R) => (room.slug ? [{ ...room, slug: stegaClean(room.slug) }] : []))
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
    return groups.flatMap((group: G) =>
        group.slug ? [{ ...group, slug: stegaClean(group.slug) }] : [],
    )
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
    return groups.flatMap((group: G) =>
        group.slug ? [{ ...group, slug: stegaClean(group.slug) }] : [],
    )
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

// ─── Arrangements ────────────────────────────────────────────────────────────

export type ArrangementRoom = { _id: string; title: string; slug: string }
export type ArrangementEventType = {
    _id: string
    name: string
    slug: string
    taxonomyGroup: { _id: string; name: string; slug: string } | null
}
export type ArrangementGroup = { _id: string; name: string; category: string }

export async function fetchArrangementRooms(): Promise<ArrangementRoom[]> {
    return sanityClient.fetch(
        arrangementRoomsQuery,
        {},
        { next: { revalidate: 300, tags: ["rooms"] } },
    )
}

export async function fetchArrangementEventTypes(): Promise<ArrangementEventType[]> {
    return sanityClient.fetch(
        arrangementEventTypesQuery,
        {},
        { next: { revalidate: 300, tags: ["eventTypes"] } },
    )
}

export async function fetchArrangementGroups(): Promise<ArrangementGroup[]> {
    return sanityClient.fetch(
        arrangementGroupsQuery,
        {},
        { next: { revalidate: 300, tags: ["studentGroups"] } },
    )
}

export async function fetchPublishedArrangements() {
    const { data } = await sanityFetch({
        query: publishedArrangementsQuery,
        params: { today: getOsloDateString() },
        tags: ["arrangements"],
    })
    return data
}

export async function fetchKontaktPage() {
    const { data } = await sanityFetch({
        query: kontaktPageQuery,
        tags: ["kontaktPage"],
    })
    return data
}

export async function fetchArrangementBySlug(slug: string) {
    const { data } = await sanityFetch({
        query: arrangementBySlugQuery,
        params: { slug, today: getOsloDateString() },
        tags: ["arrangements"],
    })
    return data
}

export async function fetchFooter() {
    const { data } = await sanityFetch({ query: footerQuery, tags: ["footer"] })
    return data
}

export async function fetchLinkInBio() {
    const { data } = await sanityFetch({ query: linkInBioQuery, tags: ["linkInBio"] })
    return data
}

function getOsloDateString() {
    return new Intl.DateTimeFormat("en-CA", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "Europe/Oslo",
        year: "numeric",
    }).format(new Date())
}
