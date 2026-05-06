import "server-only"

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
    roomBySlugQuery,
    roomSlugsQuery,
    roomsPageQuery,
    roomsQuery,
    siteMetadataEnQuery,
    siteMetadataNbQuery,
    studentGroupBySlugQuery,
    studentGroupSlugsQuery,
    studentGroupsQuery,
    volunteerGroupSummariesEnQuery,
    volunteerGroupSummariesNbQuery,
} from "./query-definitions"
import type {
    EventsPageContent,
    GroupsPageContent,
    HomeBarContent,
    HomePageContent,
    RoomDetail,
    RoomSummary,
    RoomsPageContent,
    SiteMetadataContent,
    StudentGroupDetail,
    StudentGroupSummary,
} from "./types"

export async function fetchLaunchGroups(locale: AppLocale): Promise<LaunchGroupContent[]> {
    const groups = await sanityClient.fetch(
        locale === "en" ? launchGroupsEnQuery : launchGroupsNbQuery,
        {},
        { next: { revalidate: 300, tags: ["launchGroups"] } },
    )

    return groups.flatMap(group => {
        if (!group.slug) {
            return []
        }

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

    return rooms.flatMap(room => (room.slug ? [{ ...room, slug: room.slug }] : []))
}

export async function fetchRoomSlugs(): Promise<string[]> {
    const rooms = await sanityClient.fetch(
        roomSlugsQuery,
        {},
        { next: { revalidate: 300, tags: ["rooms"] } },
    )

    return rooms.flatMap(room => (room.slug ? [room.slug] : []))
}

export async function fetchRoomBySlug(slug: string): Promise<RoomDetail | null> {
    return sanityClient.fetch(
        roomBySlugQuery,
        { slug },
        { next: { revalidate: 300, tags: ["rooms"] } },
    )
}

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

    return groups.flatMap(group => (group.slug ? [{ ...group, slug: group.slug }] : []))
}

export async function fetchStudentGroupSlugs(): Promise<string[]> {
    const groups = await sanityClient.fetch(
        studentGroupSlugsQuery,
        {},
        { next: { revalidate: 300, tags: ["studentGroups"] } },
    )

    return groups.flatMap(group => (group.slug ? [group.slug] : []))
}

export async function fetchStudentGroupBySlug(slug: string): Promise<StudentGroupDetail | null> {
    return sanityClient.fetch(
        studentGroupBySlugQuery,
        { slug },
        { next: { revalidate: 300, tags: ["studentGroups"] } },
    )
}
